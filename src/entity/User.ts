import { generateToken } from '@src/lib/token/jwt';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  getRepository,
} from 'typeorm';
import { AuthToken } from './AuthToken';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  email!: string;

  @Column()
  display_name!: string;

  @Column({ length: 255, nullable: true })
  photo_url?: string;

  @Column({ default: false })
  is_admin!: boolean;

  @Index()
  @CreateDateColumn({ type: 'timestamp' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at!: Date;

  async generateUserToken() {
    const authToken = new AuthToken();
    authToken.user = this;
    await getRepository(AuthToken).save(authToken);

    const accessToken = await generateToken(
      {
        userId: this.id,
      },
      {
        subject: 'accessToken',
        expiresIn: '1h',
      }
    );
    const refreshToken = await generateToken(
      {
        userId: this.id,
        tokenId: authToken.id,
      },
      {
        subject: 'refreshToken',
        expiresIn: '30d',
      }
    );
    return {
      accessToken,
      refreshToken,
    };
  }

  async refreshUserToken(
    tokenId: string,
    refreshTokenExp: number,
    originRefreshToken: string
  ) {
    const diff = refreshTokenExp * 1000 - new Date().getTime();
    let refreshToken = originRefreshToken;

    // half of 30d;
    if (diff < 1000 * 60 * 60 * 24 * 15) {
      refreshToken = await generateToken(
        {
          userId: this.id,
          tokenId: tokenId,
        },
        {
          subject: 'refreshToken',
          expiresIn: '30d',
        }
      );
    }

    const accessToken = await generateToken(
      {
        userId: this.id,
      },
      {
        subject: 'accessToken',
        expiresIn: '1h',
      }
    );
    return {
      refreshToken,
      accessToken,
    };
  }
}
