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

const Users = mongoose.model('users',usersSchema)
const Esercises = mongoose.model('exercises',exercisesSchema)

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

/* The problem with the previous commit was that applying a limit on the exercises array before filtering by dates (from/to)
resulted in an undefined order of elements. Consequently, the date filter could return an empty array even if there were
exercises within the desired date range. By defining the query with the date filters first and then applying the limit,
the expected result is achieved. */


app.get('/api/users/:_id/logs', async (req,res)=>{

  const from = req.query.from 
  const to = req.query.to
  const limit = req.query.limit
  const id = req.params._id

  let exercisesAr = [];
  let exercises;

  const user = await Users.findById(id)

  if(!user){
    return res.status(404).json({error: 'User not found'})
  }

  const query = {user_id: id}

  if(from || to){
    if(isNaN(new Date(from)) || isNaN(new Date(to))){
      return res.status(400).json({error: 'Invalid from or to paramater'})
    }
    const fromDate = new Date(from).toISOString()
    const toDate = new Date(to).toISOString()
    query.date = {}
    query.date.$gte = fromDate //grater than 
    query.date.$lte = toDate //less than
  }

  if(limit){
    if(isNaN(parseInt(limit))){
      return res.status(400).json({error: 'Invalid limit parameter'})
    }
    exercises = await Esercises.find(query).limit(limit)
  }else{
    exercises = await Esercises.find(query)
  }

  exercises.forEach(exercise => {
    exercisesAr.push({description: exercise.description, duration: exercise.duration, date: new Date(exercise.date).toDateString() })
  })
  
  res.json({username: user.username, count: exercisesAr.length, _id: user._id, log: exercisesAr })
  
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
