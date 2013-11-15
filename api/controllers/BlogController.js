/**
 * BlogController
 *
 * @module      :: Controller
 * @description	:: A set of functions called `actions`.
 *
 *                 Actions contain code telling Sails how to respond to a certain type of request.
 *                 (i.e. do stuff, then send some JSON, show an HTML page, or redirect to another URL)
 *
 *                 You can configure the blueprint URLs which trigger these actions (`config/controllers.js`)
 *                 and/or override them with custom routes (`config/routes.js`)
 *
 *                 NOTE: The code you write here supports both HTTP and Socket.io automatically.
 *
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var async = require('async'),
		_ = require('lodash');

	module.exports = {


		index: function (req, res) {
			
			async.auto({

				// Get the blog posts
				posts: function (cb) {
					Blog.find()
						.where({ isPublished: 1 })
						.limit(3)
						.sort('createdAt DESC')
						.exec(cb);
				},


				// Get some more stuff
				// (this will happen AT THE SAME TIME as `posts` above)
				otherThings: function (cb) {
					OtherThing.find()
						.limit(30)
						.exec(cb);
				},


				// Get comments
				// (we'll wait until `posts` is finished first)
				comments: ['posts', function (cb, async_data) {

					// Get `posts`
					// (the second argument to cb() back in `posts`)
					// Used map to make sure posts are an array of ids and not just an object. 
					var posts = async_data.posts.map(function (item){ return item.id});

					// Get comments that whose `post_id` is equal to 
					// the id of one of the posts we found earlier
					Comment.count()
						.where({ post_id: posts })
						.exec(cb);
				}]

			},
			function allDone (err, async_data) {

				// If an error is passed as the first argument to cb
				// in any of the functions above, then the async block
				// will break, and this function will be called.
				if (err) return res.serverError(err);

				var posts = async_data.posts;
				var comments = async_data.comments;
				var otherThings = async_data.otherThings;

				// Fold the comments into the appropriate post
				// An in-memory join
				_.map(posts, function (post) {
					var theseComments =
						_.where(comments, { post_id: post.id });
					post.comments = theseComments;
				});

				// Show a view using our data
				res.view({
					layout: 'homeLayout',
					posts: posts,
					otherThings: otherThings
				});
			});

		}
	};