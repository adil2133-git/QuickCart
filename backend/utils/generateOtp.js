// Generates a random 4-digit numeric OTP code as a string
const generateOtp = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
};

module.exports = generateOtp;