import mongoose ,{Schema} from "mongoose"
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"  
const videoSchema=new Schema({
    videofile:{
        type:String, // cloudinary url 
        required:[true,"Video file is required"],

    },
    thumbnail:{
     type:String,
     required:[true,"Thumbnail is required"]
    },
    title:{
     type:String,
     required:[true,"Title is required"]
    },
    owner:{
      type:Schema.Types.ObjectId,
      ref:"User",
      required:true
    },
    description:{
        type:String,
        required:true
    },
    duration:{
        type:Number,  // clodinary will give the duration when video uploaded there
        required:true
    },
    views:{
      type:Number,
      default:0
    },
    isPublished:{
        type:Boolean,
        default:true
    },

},{timestamps:true})
videoSchema.plugin(mongooseAggregatePaginate)// to use aggregate  paginate in video model or this allow us to use aggregate paginate method(query) during aggregation pipeline
// mean it just wrap up around the aggregate pipeline and provide pagination features, internally it counts the total docs and return the better & clean paginated result because aggregation pipeline dont give us the metadata like total pages , current page etc.
export const Video=mongoose.model("Video",videoSchema)