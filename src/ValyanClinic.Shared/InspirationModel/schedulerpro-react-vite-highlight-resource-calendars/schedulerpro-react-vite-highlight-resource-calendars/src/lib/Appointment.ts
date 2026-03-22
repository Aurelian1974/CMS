import { EventModel } from '@bryntum/schedulerpro';

// A custom appointment class with a few extra fields
export default class Appointment extends EventModel {
    declare patient: string;
    declare confirmed: boolean;
    declare requiredRole: string;

    static get fields() {
        return [
            'patient',
            'confirmed',
            'requiredRole',
            // override field defaultValue to hours
            { name : 'durationUnit', defaultValue : 'h' }
        ];
    }
}
