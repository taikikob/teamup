// set up libraries
const express = require("express");
const app = express();
const cors = require("cors");
const pool = require("./db");

// middlewares 
// cors allows frontend to access backend, without it browsers restricts webpage to make request to a different domain
// than one that it was served from
// express.json(): Parses incoming JSON payloads (from POST/PUT requests) and puts them on req.body.
app.use(cors());
app.use(express.json());

// ROUTES

// EXAMPLE ROUTE
// create a todo
// post request since we are adding data to the database
// app.post("/todos", async(req,res) => {
//     try {
//         const { description } = req.body;
//         // $1 is syntax to prevent SQL injection
//         // Returning * makes me able to see all the data that is returned. I only want to return relevant data to user
//         const newTodo = await pool.query("INSERT INTO todo (description) VALUES ($1) RETURNING *", 
//             [description]
//         );
//         res.json(newTodo.rows[0]);
//     } catch (err) {
//         console.error(err.message);
//     }
// })



// start the server so it can listen to requests
app.listen(5001, () => {
    console.log("server has started on port 5001")
});
