// const asyncHandler=(requestHandler)=>{
//   return (req,res,next)=>{
//     try{
//       await requestHandler(req,res,next)
//     }catch(error){
//       res.status(error.code||500).json({
//         status:failed,
//         message:error.message
//       })
//       next(error)
//     }

// }}

// Higher order Function that takes function as argument and return a function
const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) =>
      next(error)
    );
  };
};
export { asyncHandler };
