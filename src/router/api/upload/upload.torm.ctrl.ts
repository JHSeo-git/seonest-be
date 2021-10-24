import { Context } from 'koa';
import AWS from 'aws-sdk';
import mime from 'mime-types';
import Joi from 'joi';
import { validateBodySchema } from '@src/lib/common';
import { getRepository } from 'typeorm';
import { User } from '@src/entity/User';
import { Image } from '@src/entity/Image';

const { AWS_BUCKET_NAME } = process.env;

const s3 = new AWS.S3({
  region: 'ap-northeast-2',
  signatureVersion: 'v4',
});

const generateSignedUrl = (path: string, filename: string) => {
  const contentType = mime.lookup(filename);
  if (!contentType) {
    const error = new Error('Failed to parse Content-Type from filename');
    error.name = 'ContentTypeError';
    throw error;
  }
  if (!contentType.includes('image')) {
    const error = new Error('Given file is not a image');
    error.name = 'ContentTypeError';
    throw error;
  }

  const key = `${path}/${filename}`;
  const signedUrlExpireSeconds = 60 * 5;
  return s3.getSignedUrl('putObject', {
    Bucket: AWS_BUCKET_NAME,
    Key: key,
    ContentType: contentType,
    Expires: signedUrlExpireSeconds,
  });
};

const generateImageFilePath = ({
  id,
  type,
  username,
}: {
  id: number;
  type: string;
  username: string;
}) => {
  return `images/${username}/${type}/${id}`;
};

type UploadImageBodySchema = {
  type: string;
  filename: string;
  filesize: number;
};
export const uploadImage = async (ctx: Context) => {
  const bodySchema = Joi.object<UploadImageBodySchema>().keys({
    type: Joi.string().required(),
    filename: Joi.string().required(),
  });

  if (!(await validateBodySchema(ctx, bodySchema))) {
    return;
  }

  const { type, filename }: UploadImageBodySchema = ctx.request.body;
  try {
    const currentUser = await getRepository(User).findOne({
      id: ctx.user?.id,
    });

    if (!currentUser) {
      ctx.status = 404;
      ctx.body = {
        name: 'UserNotFound',
        payload: 'Current User is not found',
      };
      return;
    }

    const image = new Image();
    image.type = type;
    image.user = currentUser;
    image.filename = filename;
    const imageRepo = getRepository(Image);
    await imageRepo.save(image);

    const path = generateImageFilePath({
      id: image.id,
      type,
      username: currentUser.email.split('@')[0],
    });

    const signedUrl = generateSignedUrl(path, filename);
    image.path = `${path}/${filename}`;
    await imageRepo.save(image);

    ctx.body = {
      image_path: `https://${AWS_BUCKET_NAME}/${image.path}`,
      signed_url: signedUrl,
    };
  } catch (e) {
    if (e.name === 'ContentTypeError') {
      ctx.status = 401;
      return;
    }
    ctx.throw(500, e);
  }
};
