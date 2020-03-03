const express = require('express')
var bodyParser = require('body-parser')
var MongoClient = require('mongodb');

const app = express()
const port = 5000
var url = "mongodb://localhost:27017/";

//console.log("just a github check");

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.use(bodyParser.json())

app.post('/login', (req, res) => {
    console.log(req.body.name);
    res.send(req.body.name)
})

app.post('/createUser', (req, res) => {
  var userInfo = { username : req.body.username, password : req.body.password, email : req.body.email, mobile : req.body.mobile };
  console.log(userInfo);
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("kbdb");
    dbo.collection("kbdb").insertOne(userInfo, function(err, res) {
      if (err) throw err;
      console.log("1 document inserted");
      db.close();
    });
  });
  res.send(userInfo);
})

app.post('/userProfile/basicInfo', (req, res) => {
  var basicInfo = { gender : req.body.gender, dob : req.body.dob, address : req.body.address, userType : req.body.userType };
  var addressInfo = { type: "Point", coordinates: [ parseFloat(req.body.longitude) , parseFloat(req.body.latitude) ] };
  console.log(basicInfo);
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("kbdb");
    var myquery = { username : req.body.username };
    var basicInfoValues = {$set: { basicInfo : basicInfo } };
    var addressInfoValues = {$set: { location : addressInfo }};
    dbo.collection("kbdb").updateMany(myquery, basicInfoValues, function(err, res) {
      if (err) throw err;
      console.log(res.result.nModified + " document(s) updated");
      db.close();
    });
    dbo.collection("kbdb").updateMany(myquery, addressInfoValues, function(err, res) {
      if (err) throw err;
      console.log(res.result.nModified + " document(s) updated");
      db.close();
    });
  });
  res.send("success");
})

app.post('/userProfile/educationInfo', (req, res) => {
  var educationInfo = { type : req.body.type, course : req.body.course, stream : req.body.stream, college : req.body.college, gpa :  req.body.gpa };
  console.log(educationInfo);
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("kbdb");
    var myquery = { username : req.body.username };
    var newvalues = {$addToSet: { educationInfo : educationInfo } };
    dbo.collection("kbdb").updateMany(myquery, newvalues, function(err, res) {
      if (err) throw err;
      console.log(res.result.nModified + " document(s) updated");
      db.close();
    });
  });
  res.send("success");
})

app.post('/userProfile/skillInfo', (req, res) => {
  var skillInfo = { domain : req.body.domain, skill : req.body.skill, expertise : req.body.expertise };
  console.log(skillInfo);
  MongoClient.connect(url, function(err, db) {
    if (err) throw err;
    var dbo = db.db("kbdb");
    var myquery = { username : req.body.username };
    var newvalues = {$addToSet: { skillInfo : skillInfo}  };
    dbo.collection("kbdb").updateMany(myquery, newvalues, function(err, res) {
      if (err) throw err;
      console.log(res.result.nModified + " document(s) updated");
      db.close();
    });
  });
  res.send("success");
})

app.post('/searchTrainer', async (req, res, next) => {
  try{
  console.log("Longitude is ",parseFloat(req.body.longitude));
  console.log("latitude is ",parseFloat(req.body.latitude));
  MongoClient.connect(url, async function(err, db) {
    if (err) throw err;
    var dbo = db.db("kbdb");
    var myPromise = () => {
      return new Promise((resolve, reject) => {
       
        dbo.collection("kbdb").find( {location:
          { $near:
             {
               $geometry: { type: "Point",  coordinates: [ parseFloat(req.body.longitude), parseFloat(req.body.latitude) ] },
               $minDistance: 0,
               $maxDistance: 5000
             }
          }}).toArray(function(err, result) {
          err 
                ? reject(err) 
                : resolve(result);
        });
      });
    };
      var usersAround = await myPromise();
      db.close();
      console.log("outside result "+usersAround);
      var filteredUser = usersAround.filter(function(data){
        var skill = data.skillInfo;
        console.log(skill);
        var reqSkill = skill.filter(function(skilldata){
          return skilldata.skill === req.body.skillSearch
        })
        console.log(reqSkill);
        return reqSkill.length > 0
      })
      res.send(JSON.stringify(filteredUser));
    });
  }
  catch(e){
    next(e)
  }
  })

app.listen(port, () => console.log(`Example app listening on port ${port}!`))