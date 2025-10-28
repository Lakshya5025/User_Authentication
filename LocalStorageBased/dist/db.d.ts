import mongoose from "mongoose";
export declare const userModel: mongoose.Model<{
    name?: string | null;
    password?: string | null;
}, {}, {}, {}, mongoose.Document<unknown, {}, {
    name?: string | null;
    password?: string | null;
}, {}, mongoose.DefaultSchemaOptions> & {
    name?: string | null;
    password?: string | null;
} & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}, mongoose.Schema<any, mongoose.Model<any, any, any, any, any, any>, {}, {}, {}, {}, mongoose.DefaultSchemaOptions, {
    name?: string | null;
    password?: string | null;
}, mongoose.Document<unknown, {}, mongoose.FlatRecord<{
    name?: string | null;
    password?: string | null;
}>, {}, mongoose.ResolveSchemaOptions<mongoose.DefaultSchemaOptions>> & mongoose.FlatRecord<{
    name?: string | null;
    password?: string | null;
}> & {
    _id: mongoose.Types.ObjectId;
} & {
    __v: number;
}>>;
//# sourceMappingURL=db.d.ts.map