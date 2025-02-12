const forgotPasswordTemplate = ({ name, otp }) => {
    return `
    <div>
    <p>Hi ${name},</p>
    <p>Here is your OTP to reset your password</p>
    <h1>${otp}</h1>
    <p>This otp is valid for 1 hour only </p>
    </div>
    `
}


export default forgotPasswordTemplate