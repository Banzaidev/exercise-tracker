const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

require('dotenv').config()

//exercise db

mongoose.connect(process.env.DB_URI)

const exerciseSchema = new mongoose.Schema({
  username: String,
  description: String,
  duration: Number,
  date: Date
})

const usersSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
})

const logSchema = new mongoose.Schema({
  username: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: Date
  }]
})

const Exercises = mongoose.model('exercises', exerciseSchema)
const Users = mongoose.model('users',usersSchema)

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use('/api/users',bodyParser.urlencoded())

app.post('/api/users', async (req,res)=>{
  const usernameParam = req.body.username
  if((await Users.find({username: usernameParam})).length != 0){
    const user = await Users.findOne({username: usernameParam})
    res.json({username: usernameParam, _id: user._id})
  }
  else{
    await Users.create({
      username: usernameParam
    })
    const user = await Users.findOne({username: usernameParam})
    res.json({username: usernameParam, _id: user._id})

  }

})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
