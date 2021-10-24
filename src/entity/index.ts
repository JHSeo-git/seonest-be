import { Like } from 'typeorm';
import { AuthToken } from './AuthToken';
import { Category } from './Category';
import { Image } from './Image';
import { Post } from './Post';
import { PostRead } from './PostRead';
import { SocialAccount } from './SocialAccount';
import { TempPost } from './TempPost';
import { User } from './User';

const entities = [
  AuthToken,
  Category,
  Image,
  Like,
  Post,
  PostRead,
  SocialAccount,
  User,
  TempPost,
];

export default entities;
