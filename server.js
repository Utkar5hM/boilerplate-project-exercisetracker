const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});
app.use(express.urlencoded({
  extended: false
}))
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

mongoose.connect(process.env['dburl'], { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
  console.log("connection successfull")
})

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true
    },
    count: {
      type: Number,
      default: 0
    },
    log: {
      type: []
    }
  })
const user = new mongoose.model('user', userSchema);
app.post(`/api/users`, async (req, res) => {
  let foundUser = await user.find({ username: req.body.username })
  let userToAdd = new user({ username: req.body.username })
  await userToAdd.save();
  res.send(userToAdd);
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  let foundUser = await user.findById(req.params._id)
  let dat;
  if (req.body.date === "") {
    dat = new Date().toDateString();
  } else {
    if (Date.parse(req.body.date)) {
      dat = new Date(req.body.date).toDateString();
    } else {
      dat = new Date().toDateString();
    }
  }
  let logItem = {
    description: req.body.description,
    duration: req.body.duration,
    date: dat
  }
  foundUser.count += 1;
  foundUser.log.push(logItem);
  await foundUser.save();
  res.send({
    _id: foundUser._id,
    username: foundUser.username,
    date: logItem.date,
    duration: parseInt(logItem.duration),
    description: logItem.description
  })
})

app.get('/api/users/:_id/logs?', async (req, res) => {
  let foundUser = await user.findById(req.params._id);
  if ((req.query.from && req.query.to) || req.query.limit) {
    let qfrom;
    let qto;
    let qlogs = foundUser.log;
    if (req.query.from && req.query.to) {
      qfrom = new Date(req.query.from).getTime()
      qto = new Date(req.query.to).getTime();
      qlogs = qlogs.filter((x) => {
        let testDate = new Date(x.date).getTime();
        if (testDate >= qfrom && testDate <= qto) {
          return true;
        }
      })

    }
    if (req.query.limit) {
      qlogs = qlogs.slice(0, req.query.limit);
    }
    for (let i in qlogs) {
      qlogs[i].duration = parseInt(qlogs[i].duration);
    }
    res.json({
      _id: foundUser._id,
      username: foundUser.username,
      count: parseInt(qlogs.length.toString()),
      log: [...qlogs]
    })
  } else {
    res.send(foundUser);
  }
})
app.get('/api/users/:_id/logs', async (req, res) => {
  let foundUser = await user.findById(req.params._id);
  res.send(foundUser);
})
app.get('/api/users', async (req, res) => {
  let allUsers = await user.find({});
  res.json(allUsers);
})