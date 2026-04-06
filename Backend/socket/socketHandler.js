const Message = require("../models/Message");
const User = require("../models/User");

const socketHandler = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // User join kare chat room
    socket.on("join_room", (userId) => {
      socket.join("global_room");
      console.log(`User ${userId} joined global room`);
    });

    // Message receive karo aur broadcast karo
    socket.on("send_message", async (data) => {
      try {
        const user = await User.findById(data.userId);

        // Sirf Pro users message bhej sakte hain
        if (!user || user.subscriptionStatus !== "pro") {
          socket.emit("error", { message: "Upgrade to Pro to send messages" });
          return;
        }

        const message = await Message.create({
          sender: user._id,
          senderName: user.name,
          content: data.content,
        });

        // Sab ko message bhejo
        io.to("global_room").emit("receive_message", {
          _id: message._id,
          sender: user._id,
          senderName: user.name,
          content: message.content,
          createdAt: message.createdAt,
        });
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
