import mongoose, { Schema, Document } from 'mongoose';

export interface IApiPlatform extends Document {
  name: 'apollo' | 'hunter' | 'snov' | 'lusha' | 'rocketreach' | 'skrapp' | 'getprospect';
  displayName: string;
  testEndpoint: string;
  searchEndpoint: string;
  docsUrl: string;
}

const ApiPlatformSchema: Schema = new Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true,
    enum: ['apollo', 'hunter', 'snov', 'lusha', 'rocketreach', 'skrapp', 'getprospect']
  },
  displayName: { type: String, required: true },
  testEndpoint: { type: String, required: true },
  searchEndpoint: { type: String, required: true },
  docsUrl: { type: String, required: true }
});

export default mongoose.models.ApiPlatform || mongoose.model<IApiPlatform>('ApiPlatform', ApiPlatformSchema);
