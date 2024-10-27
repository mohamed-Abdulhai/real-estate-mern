import { AppError, catchError } from "../utilities/error/error.js"

export const createHandler = (model)=>{
    return catchError(async(req,res,next)=>{
        const newDocument = new model(req.body)

        await newDocument.save()
        return res.status(201).json({
            data: newDocument,
            statusMessage:`${model.collection.name} created successfully`
    })
    })
}

export const getSingleHandler = (model)=>{
    return catchError(async(req,res,next)=>{
        const document  = await model.findById(req.params.id)
        if(!document) return next(new AppError(`${model.collection.name} not found`, 404,'failed'))
        
        return res.status(200).json({
            data: document,
        })
    })
}

export const getAllHandler = (model)=>{
    return catchError(async(req,res,next)=>{
        const documents = await model.find()
        return res.status(200).json({
            data: documents,
        })
    })
}

export const updateHandler = (model)=>{
    return catchError(async(req,res,next)=>{
    const documents = await model.findByIdAndUpdate(req.params.id,req.body,{new:true,runValidators:true})
    if(!documents) return next(new AppError(`${model.collection.name} not found`, 404,'failed'))
    
    return res.status(200).json({
        data: documents,
        statusMessage:`${model.collection.name} updated successfully`
    })
})
}

export const deleteSingleHandler = (model)=>{
    return catchError(async(req,res,next)=>{
    const documents = await model.findByIdAndDelete(req.params.id)
    if(!documents) return next(new AppError(`${model.collection.name} not found`, 404,'failed'))
    
    return res.status(200).json({
        data: documents,
        statusMessage:`${model.collection.name} deleted successfully`
    })
})
}

export const deleteAllHandler = (model)=>{
    return catchError(async(req,res,next)=>{
    const documents = await model.deleteMany()
    
    return res.status(200).json({
        data: documents,
        statusMessage:`All ${model.collection.name}s deleted successfully`
    })

})
}