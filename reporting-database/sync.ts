import db from "./connection";
import mongoose from "mongoose";
import Order from "../server/models/Order";
import {type Order as OrderType} from "../shared/types"


async function connectToMongo() {
    const MONGO_URI = process.env.MONGODB_URI || '';

    if (!MONGO_URI) {
        throw new Error('MONGODB_URI environment variable is not set.');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connected.');
}


const getAllOrders = async (): Promise<OrderType[]> => {
    try {
        const orders: OrderType[] = await Order.find().lean();
        return orders;
    } catch (error) {
        throw new Error(`Failed to fetch orders from Mongo: ${error}`);
    }
}

const mapOrdersToSQL = (Orders: OrderType[]) => {

}

const gracefulExit = (e) => {
    console.error('CRITICAL SYNC ERROR:', e.message);
    db.destroy();
    mongoose.connection.close();
    process.exit(1);
};
