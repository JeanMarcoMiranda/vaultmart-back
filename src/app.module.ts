import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantsModule } from './modules/tenants/tenants.module';
import { TenantsService } from './modules/tenants/tenants.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (ConfigService: ConfigService) => ({
        type: 'postgres',
        host: ConfigService.get<string>('DB_HOST'),
        port: ConfigService.get<number>('DB_PORT'),
        username: ConfigService.get<string>('DB_USERNAME'),
        password: ConfigService.get<string>('DB_PASSWORD'),
        database: ConfigService.get<string>('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    TenantsModule,
  ],
  providers: [TenantsService],
})
export class AppModule {}
