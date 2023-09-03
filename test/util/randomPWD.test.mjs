import { expect } from 'chai';
import generatePassword from '../../util/randomPWD.js'; // Adjust the path accordingly

describe('Password Generator', () => {
    it('should generate a password of the specified length', () => {
      expect(generatePassword(1).length).to.equal(1);
        expect(generatePassword(10).length).to.equal(10);
        expect(generatePassword(20).length).to.equal(20);
    });

    it('should generate a low complexity password', () => {
        const password = generatePassword(10, 'low');
        expect(password).to.match(/^[a-z0-9]{10}$/);
    });

    it('should generate a medium complexity password', () => {
        const password = generatePassword(10, 'medium');
        expect(password).to.match(/^[a-zA-Z0-9]{10}$/);
    });

    it('should generate a high complexity password', () => {
        const password = generatePassword(10, 'high');
        expect(password).to.match(/^[a-zA-Z0-9!@\-_=<>*\s\/|#*%+&^$~`()\[\]{}\.]{10}$/);
    });
});
