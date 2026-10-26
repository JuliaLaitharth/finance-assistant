import { IsOptional, IsString } from 'class-validator';

export class ItemDto { @IsString() itemId: string; }
export class ConnectTokenDto { @IsOptional() @IsString() itemId?: string; }
