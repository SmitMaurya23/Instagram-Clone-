//index.js

const express = require('express');
const router = express.Router();
const userModel = require("./users");
const passport = require('passport');
const localStrategy = require("passport-local");
const postModel = require('./post');
const likeModel = require('./like');
passport.use(new localStrategy(userModel.authenticate()));
const upload = require('./multer');
const post = require('./post');




function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/");
}

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/* GET home page. */
router.get('/', function(req, res, next) {
  res.redirect('/login');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Handle user registration form submission
router.post('/register', function(req, res) {
  const {name, email, username, password } = req.body;
  const newUser = new userModel({ name,email, username });
  userModel.register(newUser, password, function(err, user) {
    if (err) {
      req.flash('error', err.message);
      return res.redirect('/register');
    }
    passport.authenticate('local')(req, res, function() {
      res.redirect('/profile');
    });
  });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get('/register', function(req, res) {
  res.render('register', { error: req.flash('error') });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/login', function(req, res) {
  let error = req.flash('error');
  if (error.length > 0) {
    error = error[0];
  } else {
    error = null;
  }
  res.render('index', { error: error });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.post('/login', function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { 
      return next(err); 
    }
    if (!user) { 
      req.flash('error', 'Wrong username or password');
      return res.redirect('/login'); 
    }
    req.logIn(user, function(err) {
      if (err) { 
        return next(err); 
      }
      return res.redirect('/profile');
    });
  })(req, res, next);
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/userprofile/:username', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.params.username});
  let posts = user.posts;

  // Fetch all the corresponding Image values from the entries in postModel
  let images = [];
  for(let i=0; i<posts.length; i++){
    let post = await postModel.findOne(posts[i]);
    images.push(post.image); // assuming 'image' is the field name in postModel
  }
  if(req.params.username==req.session.passport.user){
    res.redirect('/profile');
  }else{
    res.render('userprofile',{images:images, user:user});
  }

 
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/profile', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  let posts = user.posts;

  // Fetch all the corresponding Image values from the entries in postModel
  let images = [];
  for(let i=0; i<posts.length; i++){
    let post = await postModel.findOne(posts[i]);
    images.push(post.image); // assuming 'image' is the field name in postModel
  }

  res.render('profile',{images:images, user:user});
 
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/postDetail/:image', isLoggedIn, async function(req, res) {
  const post = await postModel.findOne({image: req.params.image});
  const user_self = await userModel.findOne({username: req.session.passport.user});
  const user = await userModel.findOne({_id: post.author});

  if(user_self.email==user.email){
    res.render('selfPostDetail', { post: post, user:user,user_self:user_self });
  }else{
    res.render('postDetail', { post: post, user:user,user_self:user_self });
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/selfPostDetail/:image', isLoggedIn, async function(req, res) {
  const post = await postModel.findOne({image: req.params.image});
  const user_self = await userModel.findOne({username: req.session.passport.user});
  const user = await userModel.findOne({_id: post.author});

  res.render('selfPostDetail', { post: post, user:user,user_self:user_self });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/editPost/:image', isLoggedIn, async function(req, res) {
  const post = await postModel.findOne({ image: req.params.image }); // here it can successfully fetch post
  console.log(post);
  res.render('editPost', {post});
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/editPost/:image', isLoggedIn, upload.single('file'), async function(req, res) {
  try {
    // Find the post based on the image parameter
    const post = await postModel.findOne({ image: req.params.image });// problem is here it is showing that post is null
    console.log(req.params.image);
    console.log(post);


    // Check if a file was uploaded
    if (!req.file) {
      return res.status(400).send("No file was uploaded");
    }

    // Find the currently authenticated user
    const user = await userModel.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send("User not found");
    }
    console.log(post);
    // Update post details
    post.description = req.body.description; // Assuming you have a form field for description
    post.image = req.file.filename; // Assuming the uploaded file's filename is stored
    // Save the updated post
    await post.save();
    console.log(post);

    // Redirect to the post detail page for the updated post
    res.redirect(`/selfPostDetail/${post.image}`);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).send("An error occurred while updating the post");
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get('/deletePost/:image', isLoggedIn, async function(req, res) {
  try {
    const post = await postModel.findOne({ image: req.params.image });
    const user = await userModel.findOne({username: req.session.passport.user});
    if (!post) {
      return res.status(404).send('Post not found');
    }
    await postModel.deleteOne({ image: req.params.image });
    user.posts.pull(post._id);
    await user.save();
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while deleting the post');
  }
});
/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/postDetail/:image/comment', isLoggedIn, async function(req, res) {
  try {
    const post = await postModel.findOne({image: req.params.image});
    const user = await userModel.findOne({username: req.session.passport.user});
    const comment = {username: user.username, text: req.body.comment};
    post.comments.push(comment);
    await post.save();
    res.redirect('/postDetail/' + req.params.image);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred while adding the comment');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/liked/:postID', isLoggedIn, async function(req, res) {
  try {
    const post = await postModel.findOne({_id: req.params.postID});
    const user = await userModel.findOne({username: req.session.passport.user});
    const image = post.image;

    if (!post || !user) {
      return res.status(404).send('Post or user not found');
    }

    // Check if the user has already liked the post
    const like = await likeModel.findOne({userID: user._id, postID: req.params.postID});
    if (!like) {
      // The user hasn't liked the post yet, so create a new like
      await likeModel.create({userID: user._id, postID: req.params.postID});
      await postModel.updateOne({_id: req.params.postID}, {$inc: {likes: 1}});
    } else {
      // The user has already liked the post, so remove the like
      await likeModel.deleteOne({_id: like._id});
      await postModel.updateOne({_id: req.params.postID}, {$inc: {likes: -1}});
    }

    res.redirect(`/postDetail/${image}`);
  } catch (error) {
    console.error(error);
    res.status(500).send('An error occurred');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
router.get('/feed', async function(req, res) {
  try {
    // Fetch all posts that are not from the current user
    let posts = await postModel.find({ author: { $ne: req.user._id } });

    // Shuffle the array of posts
    posts = posts.sort(() => Math.random() - 0.5);

    // Extract the image paths from the posts
    let images = posts.map(post => post.image);

    // Render the feed page with the shuffled images
    res.render('feed', { images: images });
  } catch (err) {
    console.log(err);
    res.redirect('/');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



router.get('/logout', function(req, res){
  req.logout(function(err) {
    if (err) {
      // Handle error
      return next(err);
    }
    // Redirect or perform any other action after logout
    res.redirect('/');
  });
});


/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/editProfile', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({ username: req.user.username });
  res.render('editProfile', { user });
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/editProfile', isLoggedIn, async function(req, res) {
  try {
    const user = await userModel.findOne({ username: req.user.username });
    if (req.body.username) {
      user.username = req.body.username;
    }
    if (req.body.email) {
      user.email = req.body.email;
    }
    await user.save();
    req.login(user, function(err) {
      if (err) { 
        return next(err); 
      }
      return res.redirect('/profile');
    });
  } catch (error) {
    console.error(error);
    res.redirect('/editProfile');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/changePassword', isLoggedIn, function(req, res) {
  res.render('changePassword');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.post('/changePassword', isLoggedIn, async function(req, res) {
  try {
    const user = await userModel.findOne({ username: req.user.username });
    user.changePassword(req.body.currentPassword, req.body.newPassword, function(err) {
      if (err) {
        // Handle error
        console.error(err);
        res.redirect('/changePassword');
      } else {
        res.redirect('/profile');
      }
    });
  } catch (error) {
    console.error(error);
    res.redirect('/changePassword');
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


router.get('/upload', isLoggedIn, async function(req, res) {
  const user = await userModel.findOne({username: req.session.passport.user});
  res.render('upload',{user:user});
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Add a route for uploading profile images
router.post('/upload', isLoggedIn, upload.single('file'), async function(req, res) {
  if(!req.file){
    return res.status(404).send("No files were given");
  }
  const user = await userModel.findOne({username: req.session.passport.user});
  console.log(user._id);
  user.profileImage = req.file.filename;
  await user.save();
  res.redirect('/upload');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

router.get('/uploadPost', isLoggedIn, async function(req, res) {
  res.render('uploadPost');
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Add a route for uploading profile images
router.post('/uploadPost', isLoggedIn, upload.single('file'), async function(req, res) {
  if(!req.file){
    return res.status(404).send("No files were given");
  }

  try {
    const user = await userModel.findOne({username: req.session.passport.user});
    if (!user) {
      return res.status(404).send("User not found");
    }
    
    const post = await postModel.create({
      author: user._id,
      description: req.body.description,
      image: req.file.filename, // Assuming you store the path to the image file
    });
    user.posts.push(post._id);
    await user.save();
    res.redirect('/profile');
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred");
  }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// searchBar feature implementation
router.get('/search', isLoggedIn, async function(req, res) {
  try {
    const { username } = req.query;
    // Query the database for users matching the search query
    const users = await userModel.find({ username: { $regex: username, $options: 'i' } });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while searching for users' });
  }
});



module.exports = router;
