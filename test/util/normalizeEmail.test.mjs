import { expect } from 'chai';
import normalizeEmail from '../../util/normalizeEmail.js';

describe('normalizeEmail', function() {
    
    it('should return error for invalid email', function() {
        expect(normalizeEmail('invalidEmail')).to.equal('error');
    });

    it('should convert email to lowercase', function() {
        expect(normalizeEmail('TEST@EXAMPLE.COM')).to.equal('test@example.com');
    });

    it('should remove periods from the local part prevent double register.', function() {
        expect(normalizeEmail('test.email@example.com')).to.equal('testemail@example.com');
    });

    it('should replace googlemail domain with gmail', function() {
        expect(normalizeEmail('user@googlemail.com')).to.equal('user@gmail.com');
    });

    it('should handle null or undefined email', function() {
        expect(normalizeEmail(null)).to.equal('error');
        expect(normalizeEmail()).to.equal('error');
        expect(normalizeEmail("usergooglemail.com")).to.equal('error');
    });

});
