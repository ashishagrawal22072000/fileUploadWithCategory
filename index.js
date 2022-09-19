const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage').GridFsStorage;
const Grid = require('gridfs-stream');
const {generateToken, isAuth} = require('./middleware/auth')
const cookieParser = require('cookie-parser');
const userModel = require("./model/user");
const bcrypt = require('bcryptjs');
const { request } = require('express');

require('./db/conn')
app.use(cookieParser())
app.set("view engine", 'ejs')
app.use(bodyParser());

app.set('view engine', 'ejs')


app.get('/signup', (req,res) =>{
    res.render('register');
})
app.get('/signin', (req,res) =>{
    res.render('login');
})

app.get('/upload', isAuth, (req,res) =>{
        res.render('upload');
})

app.post('/signup', async (req, res) => {
    try{
        console.log(req.body)
        const {email, password} = req.body;
        console.log(email, password)
        const user = await userModel.findOne({email: email});
        if(user){
            return res.status(409).json({message : "user already exists"});
        }else{
            const newUser = await userModel({
                email: email,
                password: password
            });
            await newUser.save();
            res.redirect('/signin');
        }
        
    }catch(err){
        console.log(err);
        res.status(500).json({error : err});
    } 
});




app.post('/signin', async (req, res) => {
    try{
        const {email, password} = req.body;
        console.log(email, password)
        const user = await userModel.findOne({email: email});
        if(user){
            const isPassword = bcrypt.compare(password, user.password);
            if(isPassword){
                const token =  generateToken(user)
        console.log(token);

        res.cookie("owner", token, {
          expires: new Date(Date.now() + 100000000),
          httpOnly: true,
        });
                res.redirect('/upload');
            }
            else{
                return res.status(400).json({message : "invalid crediantials"});

            }
        }else{
            return res.status(400).json({message : "invalid credentials"});
        }
        
    }catch(err){
        console.log(err);
        res.status(500).json({error : err});
    } 
});



const mongoURI = 'mongodb+srv://ashish:ashish@cluster0.fdovbiu.mongodb.net/?retryWrites=true&w=majority'

const conn = mongoose.createConnection(mongoURI);

let gfs;

conn.once('open', function(){
    gfs =   Grid(conn.db, mongoose.mongo);
    gfs.collection('files');
})



var storage = new GridFsStorage({
    url : mongoURI,
     file : (req,file) => {
        console.log(req.userID, req.body.category)
        return new Promise((resolve,reject) => {
            if(!file){
                return reject('No file specified');
            }else{
                const fileInfo = {
                    filename : file.originalname,
                    bucketName : 'files',
                    metadata: {
                        user:req.userID,
                        category : req.body.category
                      }, 
                }
                return resolve(fileInfo);
            }
        })
     }
})


const upload = multer({storage : storage
    , fileFilter : async function (req, file, cb){
    console.log(gfs.files.find({filename: file.originalname}))
    gfs.files.find({filename: file.originalname}).toArray((err, files) => {
        console.log(files)
        if(files.length > 0){   
            req.fileValidationError = "you can't upload more than one file at once.";
            cb(null, false, req.fileValidationError);
        } else { 
            cb(err, true, req.body.category);
        }
    })
}
});

app.get('/upload', isAuth,  function(req,res) {
    res.render("upload");
})

app.post('/upload',isAuth,  upload.single('file'), (req,res) =>{
    try {
    
        if(req.fileValidationError){
          res.send(req.fileValidationError);
       }   else{
          res.send("file uploaded")
       }
      } catch (err) {
        console.log(err);
      }
})


app.get('/files', (req,res) => {
    gfs.files.find().toArray((err, files) =>{
        if(!files || files.length == 0){
            console.log(err)
            res.json({error : 'No files found'});
        }else{
            res.json({files : files})
        }
    })
}
)

app.listen(3000, function() {   console.log('Express server listening on port 3000'); });
