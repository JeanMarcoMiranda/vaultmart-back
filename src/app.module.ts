import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TenantsService } from './modules/tenants/tenants.service';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { BusinessesModule } from './modules/businesses/businesses.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [__dirname + '../**/*.entity{.ts,.js}'],
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),
    TenantsModule,
    UsersModule,
    AuthModule,
    BusinessesModule,
  ],
  providers: [TenantsService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'tenants', method: RequestMethod.POST },
        { path: 'tenants', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
