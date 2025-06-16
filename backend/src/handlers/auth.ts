import { Request, Response } from "express-serve-static-core";
import pool from '../db'
import { SignupDto } from "../dtos/Signup.dto";

export async function postSignup (request: Request<{},{}, SignupDto>, response: Response) {
    // TODO: Implement signup logic
    const { firstName, lastName, email, password } = request.body;
    console.log(request.body);
}

export async function postLogin (request: Request, response: Response) {
    // TODO: Implement login logic
    const { email, password } = request.body;
}