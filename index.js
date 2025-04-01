const express = require('express')
const app = express()
const cors = require('cors')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')

require('dotenv').config()

mongoose.connect(process.env.DB_URI)

const usersSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true
  },
})

const Users = mongoose.model('users',usersSchema)

app.use(cors())
app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.use('/api/users',bodyParser.urlencoded())

app.route('/api/users')
.post(async (req,res)=>{
  
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
