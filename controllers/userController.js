const {pool} = require("../config/dbConfig");
const jwt = require('jsonwebtoken');
const randomstring = require("randomstring");
const bcrypt = require("bcryptjs");
const { response } = require("express");



const authenticateUserCredentials = async(req, res)=>{
    try {
        const userCredentials = req.body;
        //check if user credentials is empty
        if(userCredentials.Email!=='' && userCredentials.Password!==''){
            const userExist = await pool.query(`SELECT * FROM users WHERE email='${userCredentials.Email}'`);
            //check if user credentials present in DB
            if(userExist.rowCount && userExist.rows[0].email===userCredentials.Email){
				bcrypt.compare(userCredentials.Password, userExist.rows[0].password)
				.then(response => {
					if(response){
						const accessToken = jwt.sign({userid:userExist.rows[0].userid,isadmin:userExist.rows[0].isadmin}, process.env.JWT_SECRET,{
							expiresIn: "1d",
						});
						const isadmin = userExist.rows[0].isadmin;
						res.json({accessToken, isadmin});
					}
					else {
						res.send('Wrong Password!');
					}
				})
                
            }
            else {
                res.send('User does not exist!');
            }
        }
        else{
            res.send('Please provide correct information!')
        }
    } catch (error) {
        res.send(error);   
    }
}



const userRegister = async (req, res)=>{
	try{
		const userData = req.body;
		const userExist = await pool.query(`SELECT userid FROM users WHERE userid='${userData.user_ID}';`);
		if(userExist.rowCount && userExist.rows[0].userid === userData.user_ID){
			return res.send("User ID Already Exists!");
		}
		const emailExist = await pool.query(`SELECT email FROM users WHERE email='${userData.Email}';`);
		if(emailExist.rowCount && emailExist.rows[0].email === userData.Email){
			return res.send("Email Already Exist!");
		}

		if(userData.Name!='' && userData.user_ID!='' && userData.Email!='' && userData.Department!='' && userData.Class!='' && userData.Contact!='' && userData.Year!='' && userData.Password!=''){
			bcrypt.hash(userData.Password, 10)
			.then(async (hash) => {
				await pool.query(`INSERT INTO users (userid, name, department, class, email, contact, year, password) VALUES ('${userData.user_ID}', '${userData.Name}', '${userData.Department}', '${userData.Class}', '${userData.Email}', '${userData.Contact}', '${userData.Year}', '${hash}');`);
				const accessToken = jwt.sign({userid:userData.user_ID,isadmin:false}, process.env.JWT_SECRET,{
					expiresIn: "1d",
				});
				res.json({accessToken});	
			}, (err)=>{
				res.send(err);
			})
		}
		else {
			res.status(400).send('Bad Request');
		}
	}
	catch(err){
		res.send(err);
	}
}


const getUserDetails = async(req,res)=>{
	try {
		const foundUser = await pool.query(`SELECT * FROM users WHERE userid = '${req.user.userid}'`);
		if(foundUser.rowCount && foundUser.rows[0].userid === req.user.userid){
			res.json(foundUser.rows[0]);
		}
		else {
			res.send('User not found!');
		}
	} catch (error) {
		res.send(error);
	}
}


const updateUserDetails = async(req, res)=>{
	try {
		const updatedUserData = req.body;
		const userid = req.user.userid;
		await pool.query(`UPDATE users SET name='${updatedUserData.Name}', department='${updatedUserData.Department}',
						class='${updatedUserData.Class}', year='${updatedUserData.Year}', email = '${updatedUserData.Email}', 
						contact='${updatedUserData.Contact}' WHERE userid='${userid}';`);
		res.send('Updated!')
	} catch (error) {
		res.send(error);
	}
}



const getUserAttendance = async(req, res) => {
	if(req.user.isadmin){
		const getAllUserAttendace = await pool.query(`SELECT users.userid, users.name, users.department, users.class, users.year, CAST(attendance.in_time AS TIME), CAST(attendance.out_time AS TIME) FROM attendance LEFT JOIN users ON attendance.userid=users.userid WHERE Date(in_time)='${req.query.requestedDate}';`)
		if(getAllUserAttendace.rowCount){
			res.send(getAllUserAttendace.rows);
		}
		else{
			res.send('Not found');
		}
	}
	else{
		const getAllUserAttendace = await pool.query(`SELECT users.userid, users.name, users.department, users.class, users.year, CAST(attendance.in_time AS TIME), CAST(attendance.out_time AS TIME) FROM attendance LEFT JOIN users ON attendance.userid=users.userid WHERE Date(in_time)='${req.query.requestedDate}' AND attendance.userid='${req.user.userid}';`)
		if(getAllUserAttendace.rowCount){
			res.send(getAllUserAttendace.rows);
		}
		else{
			res.send('Not found');
		}
	}
}

const getAllUsers = async(req, res)=>{
	if(req.user.isadmin){
		try{
			const getData = await pool.query(`SELECT * FROM users`);
			res.send(getData.rows);
		}catch(err){
			console.log(err);
		}
	}
	else {
		res.send("User not authorized!")
	}
} 

const generateQrString = async(req, res)=>{
	if(req.user.isadmin){
		try{
			if(req.query.newQR==='true'){
				await pool.query(`UPDATE qrcode SET active=false`);
				const newQrId = randomstring.generate(17);
				await pool.query(`INSERT INTO qrcode (qrid, active, in_time)VALUES('${newQrId}', true, CURRENT_TIMESTAMP);`);
				res.send(newQrId);
			}
			else{
				const activeQR = await pool.query(`SELECT qrid FROM qrcode WHERE active=true;`);
				res.send(activeQR.rows[0].qrid);
			}
		}catch(err){
			console.log(err);
		}
	}
	else {
		res.send("User not authorized!")
	}
} 

const markAttendance = async (req, res)=>{
	try {
		const QRString = req.body.QRString;
		const findString = await pool.query(`SELECT qrid, active FROM qrcode WHERE qrid='${QRString}' AND active=true;`);
		if(findString.rowCount){
			const out_time_case = await pool.query(`SELECT * FROM attendance WHERE userid='${req.user.userid}' AND out_time IS NULL;`);
			if(out_time_case.rowCount){
				await pool.query(`UPDATE attendance SET out_time=CURRENT_TIMESTAMP WHERE userid='${req.user.userid}' AND out_time IS NULL;`);
				res.send('Out time marked successfully!');
			}
			else{
				await pool.query(`INSERT INTO attendance (userid, in_time) VALUES('${req.user.userid}', CURRENT_TIMESTAMP);`);
				res.send('In time marked successfully!');
			}
		}
		else{
			res.send('QR Code Expired! Generate New QR!');
		}
	} catch (error) {
		res.send(error);
	}
}

module.exports = {authenticateUserCredentials, userRegister, getAllUsers, getUserDetails, updateUserDetails, getUserAttendance, generateQrString, markAttendance};