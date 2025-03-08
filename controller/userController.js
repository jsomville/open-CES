let users = [
    {id : 1, username:"john.doe@gmail.com", paswordHash:"1234", email:"john.doe@gmail.com", phone:"0791010101", region:"1160", createdAt:"2025-03-08T11:10:01" },
    {id : 2, username:"jane.doe@gmail.com", paswordHash:"1234", email:"jane.doe@gmail.com", phone:"0791010102", region:"1000", createdAt:"2025-03-08T11:10:01" },
    {id : 3, username:"john@hotmail.com", paswordHash:"1234", email:"john@hotmail.com", phone:"0791010103", region:"1050", createdAt:"2025-01-01T11:10:01" },
    {id : 4, username:"jane@gmail.com", paswordHash:"1234", email:"jane@gmail.com", phone:"0791010104", region:"1140", createdAt:"2025-01-01T11:10:01" },
    {id : 5, username:"jim@gmail.com", paswordHash:"1234", email:"jim@gmail.com", phone:"0791010105", region:"1000", createdAt:"2025-01-01T11:10:01" },
]

// @desc Get users
// @route GET /api/users
export const getUsers = (req, res, next) => {
    const limit = parseInt(req.query.limit);
    if (!isNaN(limit) && limit > 0){
        return res.status(200).json(users.slice(0,limit));
    }
    res.status(200).json(users);
}

// @desc Get one user
// @toute GET /api/users:id
export const getUser = (req, res, next) => {
    const id = parseInt(req.params.id);
    const post = users.find((post) => post.id === id);

    if (!post){
        const error = new Error(`Post with id ${id} was not found`);
        error.status = 404;
        return next(error);
    }
    
    res.status(200).json(user);
};

// @desc Create a User
// @route POST /api/users
export const createUser = (req, res, next) => {
    //console.log(req.body);

    const newUser = {
        id : users.length +1,
        title : req.body.title,
    }

    if (!newPost.title){
        const error = new Error('Please include a title');
        error.status = 400;
        return next(error);
    }

    users.push(newUser);
    res.status(201).json(users)
};

// @desc Update a User
// @route PUT /api/users
export const updateUser = (req, res, next) =>{

    const id = parseInt(req.params.id);
    const user = users.find((user) => user.id === id);

    if (!user){
        const error = new Error(`User with id ${id} was not found`);
        error.status = 400;
        return next(error);
    }
    user.title = req.body.title

    res.status(201).json(users)

};

// @desc Delete a User
// @route DELETE /api/user
export const deleteUser = (req, res, next) =>{

    const id = parseInt(req.params.id);
    const post = users.find((user) => user.id === id);

    if (!user){
        const error = new Error(`User with id ${id} was not found`);
        error.status = 404;
        return next(error);
    }

    users = users.filter((user) => user.id !== id);
    res.status(200).json(users)
};