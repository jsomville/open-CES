export const register = async (req, res, next) => {
  try {
    

    return res.status(200).send()
  }
  catch (error) {
    console.error(error.message);
    return res.status(500).json({ message: "Error registering user" })
  }
}
