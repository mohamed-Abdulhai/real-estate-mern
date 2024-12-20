import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import {AppError,catchError} from '../../utilities/error/error.js'
import {User} from '../../../DB/models/user.model.js'
import { sendEmail } from '../../utilities/error/email/confirmEmail/confirmEmail.js'
import { ConfirmEmailTemplate } from '../../utilities/error/email/confirmEmail/confirmEmailTemplate.js'
import { resetPasswordTemplate } from '../../utilities/error/email/resetPasswordTemplate.js'
import { generateAccessToken, generateConfrmToken, generateRefreshToken } from './auth.middleware.js'
import { Role } from '../../utilities/enum/enumRole.js'

const isProduction = process.env.MOOD === 'production';


export const register = catchError(async (req, res, next) => {
  const user = await User.create(req.body);
  
  const token = generateConfrmToken(user._id,user.email)
  sendEmail(user.email, 'Confirm Email', ConfirmEmailTemplate, token);

  return res.status(201).json({
      message: 'User created successfully, please confirm your email',
      statusMessage: 'success'
  });
});


export const login = catchError(async (req,res,next)=>{
  const {email,password} = req.body
  const user = await User.findOne({email})
  if(!user) return next(new AppError('Invalid email or password',422,'failed'))
  if(!user.confirmEmail) return next(new AppError('Please confirm youre email',403,'failed'))
    const matchPassword = bcrypt.compareSync(password,user.password)
  if(!matchPassword) return next(new AppError('Invalid email or password',422,'failed'))
  const accessToken = generateAccessToken(user.id,user.role)
  const refreshToken = generateRefreshToken(user.id,user.role)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    maxAge: 15 * 60 * 1000, // 15 minutes
    sameSite: 'Strict',
    secure: isProduction 
  });
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'Strict',
    secure: isProduction 
  });

  user.password = undefined;
  
  res.status(200).json({
    data: user,
    message: 'User logged in successfully',
    statusMessage: 'success'
  });

})

export const logout = catchError(async(req,res,next)=>{
  res.clearCookie('accessToken')
  res.clearCookie('refreshToken')
  return res.status(200).json({
    message:'User logged out successfully',
    statusMessage: 'success'
  })
})

export const verifyEmail = catchError(async (req, res, next) => {
  const { token } = req.params;

  jwt.verify(token, process.env.SECRET_KEY, async (error, decoded) => {
    if (error) {
      return next(new AppError('Invalid token', 400, 'failed'))
    }
    const user = await User.findByIdAndUpdate(
      decoded.id,
      { confirmEmail: true },
      { new: true }
    );

    if (!user) {
      return next(new AppError('User not found', 400, 'failed'));
    }
    res.status(200).json({
      message: 'Email verified successfully',
      statusMessage: 'success'
    });
  });
});


export const refreshToken = catchError(async (req,res,next)=>{
  const { refreshToken } = req.cookies
  if (!refreshToken) return next(new AppError('Please login no token provided', 403, 'failed'))
    jwt.verify(refreshToken,process.env.REFRESH_TOKEN_SECRET_KEY,async(error,decoded)=>{
      
      if(error) return next(new AppError('Invalid or expired refresh token', 403, 'failed'))
      const {id,role} = decoded
    const newAccessToken = generateAccessToken(id,role)
    res.cookie('accessToken',newAccessToken,{
      httpOnly: true,
      maxAge: 15 * 60 * 1000, // 15 minutes
      sameSite: 'Strict',
      secure: isProduction 
    });
    res.status(200).json({
      message:'Access token is refreshed successfully',
      statusMessage: 'success'
    })
  })
  
})

export const forgotPassword = catchError(async(req,res,next)=>{
  // const user = await User.findOne({email:req.body.email})
  // !user && next(new AppError('User not found',404,'failed'))
  // const token = jwt.sign({id:user.id,email:user.email},process.env.SECRET_KEY,{expiresIn:'1h'})
  // sendEmail(user.email, 'Reset Password', resetPasswordTemplate(token))
  // res.status(200).json({
  //   data: user,
  //   message:'Reset password link sent successfully',
  // statusMessage: 'success'
  // })
  res.json({
    message:'Forgot password endpoint not implemented yet'
  })
})

export const resetPassword = catchError(async(req,res,next)=>{
  // 
  res.json({
    message:'Reset password endpoint not implemented yet',

  })
})

export const changePassword = catchError(async(req,res,next)=>{
  const {password} = req.body
  const user = await User.findById(req.user.id)
  const matchPassword = bcrypt.compareSync(req.body.oldPassword,user.password)
  !matchPassword && next(new AppError('Old password is incorrect',401,'failed'))
  const newUser = await User.findByIdAndUpdate(req.user.id,{password},{new:true})
  newUser.password = undefined
  res.status(200).json({
    message:'Password changed successfully',
    statusMessage: 'success'
  })
})

export const checkAuth = catchError(async(req,res,next)=>{
  return res.status(200).json({
    message:'User is authenticated',
    statusMessage: 'success'
  })  
})

export const checkAuthByRole = catchError(async (req, res) => {
  return res.status(200).json({
    message: "User authenticated as admin",
    statusMessage: 'success'
  })
});