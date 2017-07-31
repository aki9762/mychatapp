var mongo = require('mongodb').MongoClient,
    client = require('socket.io').listen(process.env.PORT || 3000).sockets;
	var express=require('express');
	var app=express();
    var cors= require('cors');
   
    app.use(cors({credentials: true, origin: 'localhost'}));
 
 
    mongo.connect('mongodb://admin:12345@demo-shard-00-00-ghvl1.mongodb.net:27017,demo-shard-00-01-ghvl1.mongodb.net:27017,demo-shard-00-02-ghvl1.mongodb.net:27017/chat?ssl=true&replicaSet=demo-shard-0&authSource=admin', function(err,db){
        if(err) throw err;
 
          client.on('connection',function(socket){
					 // console.log(socket);
            var col = db.collection('messages'),
                sendStatus = function(s){
                  socket.emit('status',s);
                };
 
                //Get all Mongo message 
				col.find().limit(100).sort({_id:1}).toArray(function(err,res){
                    if(err) throw err;
                    socket.emit('output',res);
					 //console.log(res);
                });
				
				// col.find({name : "aki123"}).toArray(function(err, results){
					// console.log("my aki123 records", results); // output all records
				// });
				
				socket.on('getMyMessages', function(data){
					var refid = data.ref_id;
					
					col.find({ref_id : refid}).toArray(function(err, results){
					console.log("my records", results);
					 client.emit('myoutput', results);
				});
				});
				
				// socket.on('getFromMessages', function(data){
					// var username = data.name;
					
					// col.find({name : username}).toArray(function(err, results){
					// console.log("my "+username+" records", results);
					 // client.emit('fromoutput', results);
				// });
				// });
				
            //wait for input
            socket.on('input', function(data){
				var refid = data.ref_id;
                var name = data.name;
                var message = data.message;
 
                whitespace = /^\s*$/;
 
                if(whitespace.test(name) || whitespace.test(message))
                {
                    sendStatus('Name and Message Required');
                }
                else
                {
                    col.insert({ref_id: refid, name: name, message:message, time: Date.now()}, function(){
						
						col.find({ref_id : refid}).toArray(function(err, results){
					 client.emit('myoutput', results);
				});
                        //emit latest messages to all clients
                        client.emit('output',[data]);
						 console.log([data]);
                        sendStatus({
                            message:"Message sent",
                            clear:true
                        });
                    });
                }
 
            });
         });
    });
	