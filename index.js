const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

require('dotenv').config()

mongoose.connect(process.env.DB_URI)

const usersSchema = new mongoose.Schema({
  username: {
    type: String
  },
})

const exercisesSchema = new mongoose.Schema({
  user_id: {type: mongoose.Types.ObjectId, required: true},
  username: String,
  date: Date,
  duration: {type:Number, required: true},
  description: {type:String, required: true},
  
})

const logsSchema = new mongoose.Schema({
  username: {type: String, required: true},
  count: {type: Number, required: true},
  user_id: {type: mongoose.Types.ObjectId, required: true},
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]

})


const Users = mongoose.model('users',usersSchema)
const Esercises = mongoose.model('exercises',exercisesSchema)
const Logs = mongoose.model('logs', logsSchema)

app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use('/api/users',bodyParser.urlencoded())

app.route('/api/users')
.post(async (req,res)=>{
  try{
    const usernameParam = req.body.username
    if(!(await Users.findOne({username: usernameParam}))){
      await Users.create({
        username: usernameParam
      })
    }
    const user = await Users.findOne({username: usernameParam})
    res.json({username: usernameParam, _id: user._id})
    
  }
  catch{
    return res.status(500).json({ error: 'Internal Server Error' });
  }

})
.get(async (req,res)=>{
  try{
    const users = await Users.find()
    res.send(users)
  }
  catch{
    return res.status(500).json({ error: 'Internal Server Error' });
  }
})

app.use('/api/users/:_id/exercises',bodyParser.urlencoded())

app.post('/api/users/:_id/exercises', async (req,res)=>{
  const id = req.body[':_id'] || req.params._id
  if(!id){
    return res.status(400).json({error: "_id is required"})
  }
  const user = await Users.findById(id)
  if(!user){
    return res.status(404).json({error: 'user not found'})
  }
  //ISOstring = 2011-10-05T14:48:00.000Z
  //split("T") = 2011-10-05, T14..
  //split("T")[0] = 2011-10-05
  const dateToday = new Date(Date.now())
  const description = req.body.description 
  const duration = parseInt(req.body.duration)
  const date = req.body.date == '' || isNaN(new Date(req.body.date)) ? dateToday.toISOString().split('T')[0] : req.body.date
  if(!(description && duration) || ((/[0-9]/).test(description) || (/[a-zA-z]/).test(duration))){
    return res.status(400).json({error: 'invalid or missing description/duration '})
  }
  await Esercises.create({
    user_id: id,
    username: user.username,
    date: date,
    duration: duration,
    description: description,
    
  })
  res.json({ _id: id, username: user.username, date: new Date(date).toDateString(), duration, description})
  
})

app.get('/api/users/:_id/logs', async (req,res)=>{
  const user_id = req.params._id
  if(!user_id){
    return res.status(400).json({error: 'id is required'})
  }
  const username = await Users.findById(user_id)
  if(!username){
    return res.status(404).json({error: 'User not found '})
  }
  
  let exerciseAr = []
  const exercises = await Esercises.find({user_id: user_id})
  
  exercises.forEach((exercise) => {
    exerciseAr.push({date: exercise.date.toDateString(),description: exercise.description, duration: exercise.duration})
    
  })

  const count = exercises.length
  res.json({username, count, _id: user_id, log: exerciseAr})

  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
