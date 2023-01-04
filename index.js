const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');
const {authenticatejwt} = require('./middlewares/middlewares');
const {authenticateUserCredentials, userRegister, getAllUsers, getUserDetails, updateUserDetails, getUserAttendance, generateQrString, markAttendance} = require('./controllers/userController');
const dotenv = require('dotenv');
const app = express();

dotenv.config();
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());



app.get("/", authenticatejwt, getAllUsers);
app.post("/user/register", userRegister);
app.post("/user/login", authenticateUserCredentials);
app.get("/user/details", authenticatejwt, getUserDetails);
app.put("/user/update", authenticatejwt, updateUserDetails);
app.get("/user/attendance",authenticatejwt, getUserAttendance);
app.get("/user/getQRCode", authenticatejwt, generateQrString);
app.post("/user/markAttendance", authenticatejwt, markAttendance);

const PORT = process.env.PORT;
app.listen(PORT, ()=>{
	console.log(`Server is running on port ${PORT}...`)
});
