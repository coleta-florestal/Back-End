import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateValidationSettingsDto } from './update-validation-settings.dto';

describe('UpdateValidationSettingsDto', () => {
  const limits = { minDapCm: 1, maxDapCm: 200, minHeightM: 0.5, maxHeightM: 80 };

  it('accepts positive decimal limits', async () => {
    const dto = plainToInstance(UpdateValidationSettingsDto, limits);

    await expect(validate(dto)).resolves.toEqual([]);
  });

  describe.each(['minDapCm', 'maxDapCm', 'minHeightM', 'maxHeightM'])('%s', (field) => {
    it.each([0, -1, NaN, Infinity, -Infinity, '10', null, undefined, true])(
      'rejects invalid numeric values: %s',
      async (value) => {
        const dto = plainToInstance(UpdateValidationSettingsDto, { ...limits, [field]: value });
        const errors = await validate(dto);

        expect(errors.some((error) => error.property === field)).toBe(true);
      },
    );
  });
});
