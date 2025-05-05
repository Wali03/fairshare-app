// Importing necessary modules and packages
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
	cors: {
		origin: "*",
		methods: ["GET", "POST"],
	},
});

// Make io accessible to our route handlers
app.set('io', io);

const userRoutes = require("./routes/user");
const profileRoutes = require("./routes/profile");
const activityRoutes = require("./routes/Activity");
const friendRoutes = require("./routes/Friend");
const generalRoutes = require("./routes/General");
const groupRoutes = require("./routes/Group");
const notificationRoutes = require("./routes/Notification");
const chatRoutes = require("./routes/chat");
const expenseRoutes = require("./routes/Expense");
const dashboardRoutes = require("./routes/Dashboard");
// const paymentRoutes = require("./routes/Payments");
const database = require("./config/database");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { cloudinaryConnect } = require("./config/cloudinary");
const fileUpload = require("express-fileupload");
const dotenv = require("dotenv");

// Setting up port number
const PORT = process.env.PORT || 4000;

// Loading environment variables from .env file
dotenv.config();

// Connecting to database
database.connect();
 
// Middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
	cors({
		origin: "*",
		credentials: true,
	})
);
app.use(
	fileUpload({
		useTempFiles: true,
		tempFileDir: "/tmp/",
	})
);

// Connecting to cloudinary
cloudinaryConnect();

// Socket.IO connection handling
io.on("connection", (socket) => {
	console.log("A user connected:", socket.id);
	
	// Store user information with socket if available
	socket.on("set_user", ({ userId, userName }) => {
		console.log(`Setting user info for socket ${socket.id}:`, { userId, userName });
		socket.userId = userId;
		socket.userName = userName;
	});
	
	// Debug connected clients
	const connectedClients = Array.from(io.sockets.sockets).map(s => s[0]);
	console.log(`Currently connected clients (${connectedClients.length}):`, connectedClients);
	
	// Debug socket rooms
	const logRooms = () => {
		const rooms = io.sockets.adapter.rooms;
		console.log("Current active rooms:", Array.from(rooms.entries()).reduce((obj, [key, value]) => {
			// Don't log socket IDs as rooms
			if (!key.includes(socket.id)) {
				obj[key] = Array.from(value);
			}
			return obj;
		}, {}));
	};
	
	// Log rooms initially
	logRooms();
	
	// Join a chat room (can be a user-to-user chat or group chat)
	socket.on("join_room", (roomId) => {
		// Leave all other rooms first (except socket.id room)
		const socketRooms = Array.from(socket.rooms);
		socketRooms.forEach(room => {
			if (room !== socket.id) {
				console.log(`Leaving previous room before joining new one: ${room}`);
				socket.leave(room);
			}
		});
		
		// Now join the new room
		socket.join(roomId);
		console.log(`User ${socket.id} joined room: ${roomId}`);
		
		// List all sockets in this room
		const socketsInRoom = io.sockets.adapter.rooms.get(roomId) || new Set();
		console.log(`Sockets in room ${roomId} (${socketsInRoom.size}):`, Array.from(socketsInRoom));
	
		// Notify other clients in room that a new user joined
		socket.to(roomId).emit("user_joined", { 
			userId: socket.userId || socket.id, 
			name: socket.userName || 'Unknown user',
			roomId 
		});
		
		// Log rooms after joining
		logRooms();
	});
	
	// Send message to chat
	socket.on('send_message', (messageData) => {
		console.log('====================================================');
		console.log(`📨 Broadcasting message: ${messageData.message?.substring(0, 30)}...`);
		console.log('Message details:', {
			roomId: messageData.room,
			messageId: messageData._id,
			from: messageData.sender ? messageData.sender.name : 'Unknown',
			fromId: messageData.sender ? messageData.sender._id : 'Unknown',
			to: messageData.receiver || messageData.group || 'Unknown'
		});
		
		// Make sure the message has a room
		if (!messageData.room) {
			console.error('Message has no room ID, cannot broadcast');
			return;
		}
		
		// First, try a direct room emission to ensure targeted delivery
		io.to(messageData.room).emit('receive_message', messageData);
		
		// Then also broadcast to everyone to ensure delivery
		// This ensures the message gets through even in case of room joining issues
		io.emit('receive_message', messageData);
		
		console.log('✅ Message broadcast complete');
		console.log('====================================================');
	});
	
	// Handle room leaving
	socket.on("leave_room", (roomId) => {
		socket.leave(roomId);
		console.log(`User ${socket.id} left room: ${roomId}`);
		
		// Log rooms after leaving
		logRooms();
	});
	
	// Handle disconnect
	socket.on("disconnect", () => {
		console.log("User disconnected:", socket.id, socket.userId ? `(User: ${socket.userId})` : '');
		
		// Log rooms after disconnect
		logRooms();
	});
});

// // Setting up routes

app.use("/api/v1/auth", userRoutes);
app.use("/api/v1/profile", profileRoutes);
app.use("/api/v1/friend", friendRoutes);
app.use("/api/v1/general", generalRoutes);
app.use("/api/v1/activity", activityRoutes);
app.use("/api/v1/group", groupRoutes);
app.use("/api/v1/notifications", notificationRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/expense", expenseRoutes);
app.use("/api/v1/dashboard", dashboardRoutes);
// app.use("/api/v1/payment", paymentRoutes);

// Testing the server
app.get("/", (req, res) => {
	return res.json({
		success: true,
		message: "Your server is up and running ...",
	});
});

// Listening to the server
server.listen(PORT, () => {
	console.log(`App is listening at ${PORT}`);
});

// End of code.
