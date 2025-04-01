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
  username: String,
  description: String,
  duration: Number,
  date: Date,
  _id: Number
})


const Users = mongoose.model('users',usersSchema)
const Esercises = mongoose.model('exercises',usersSchema)

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
    res.status(500).json({ error: 'Internal Server Error' });
  }

})
.get(async (req,res)=>{
  try{
    const users = await Users.find()
    res.send(users)
  }
  catch{
    res.status(500).json({ error: 'Internal Server Error' });
  }
})


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
