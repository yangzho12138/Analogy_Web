import mongoose from "mongoose";
import { Password } from "../utils/password";

interface UserAttrs {
    email: string;
    password: string;
    searchHistoryIds: string[];
}

interface UserModel extends mongoose.Model<UserDoc> {
    build(attrs: UserAttrs): UserDoc;
}

interface UserDoc extends mongoose.Document {
    email: string;
    password: string;
    searchHistoryIds: string[];
    failedAttempts: number; // users only allowed 3 attempts to save
    isAdmin: boolean;
}

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    password: { 
        type: String,
        required: true
    },
    searchHistoryIds: {
        type: [String],
        required: false
    },
    failedAttempts: {
        type: Number,
        required: true,
        default: 0
    },
    isAdmin: {
        type: Boolean,
        required: true,
        default: false
    }
}, {
    toJSON: {
        transform(doc, ret) {
            ret.id = ret._id;
            delete ret.password;
            delete ret.__v;
            delete ret._id;
        }
    }
});

UserSchema.pre('save', async function(done) {
    if (this.isModified('password')) {
        const hashed = await Password.toHash(this.get('password'));
        this.set('password', hashed);
    }
    done();
});

UserSchema.statics.build = (attrs: UserAttrs) => {
    return new User(attrs);
};

const User = mongoose.model<UserDoc, UserModel>('User', UserSchema);

export { User };