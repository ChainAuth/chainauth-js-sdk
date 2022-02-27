import { Static, Type } from '@sinclair/typebox';

const ClientSettingsSchma = Type.Object({
  apiKey: Type.String(),
  apiSecret: Type.Optional(Type.String()),
});

type ClientSettings = Static<typeof ClientSettingsSchma>

export {
  ClientSettings,
  ClientSettingsSchma,
}