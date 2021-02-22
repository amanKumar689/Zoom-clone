const http = require('http')
const uuid = require('uuid')
const express = require('express');
const app = express();
const io = require('socket.io')(app.listen(3000))
app.use(require('express').static('public'))
app.set('view engine', 'ejs')




app.get('/', (req, res, next) => {

    res.redirect(`/${uuid.v4()}`);
});

app.get('/:room', (req, res, next) => {
  
  res.render("index.ejs",{roomId:req.params.room});
  
  
});

io.on('connection', (socket) => {
  
  
  socket.on('room_join_rqst',(roomId,id)=>{


    socket.join(roomId);

    // socket.to(roomId).emit('some',id)
    socket.to(roomId).broadcast.emit('some',id)
    
    socket.on('message',(data)=>{
    
    
      io.to(roomId).emit('message',data)
  
    })
    socket.on('ending',(data)=>{
      console.log("data",data);

      socket.to(roomId).emit('ending',data)
    })
  })
  
    

})
   
