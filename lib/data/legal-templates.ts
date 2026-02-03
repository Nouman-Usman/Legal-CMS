export interface TemplateField {
    id: string;
    label: string;
    placeholder?: string;
    type: 'text' | 'textarea' | 'date' | 'money';
}

export interface LegalTemplate {
    id: string;
    title: string;
    category: string;
    description: string;
    content: string;
    fields: TemplateField[];
}

export const LEGAL_TEMPLATES: Record<string, LegalTemplate> = {
    '1': {
        id: '1',
        title: 'Suit for Recovery',
        category: 'Civil',
        description: 'Standard plaint for recovery of money/dues under Order XXXVII CPC.',
        fields: [
            { id: 'COURT_NAME', label: 'Court Name', placeholder: 'e.g. Senior Civil Judge, Lahore', type: 'text' },
            { id: 'PLAINTIFF_NAME', label: 'Plaintiff Name', placeholder: 'Name of person filing suit', type: 'text' },
            { id: 'PLAINTIFF_FATHER', label: 'Plaintiff Father Name', placeholder: 's/o ...', type: 'text' },
            { id: 'PLAINTIFF_ADDRESS', label: 'Plaintiff Address', type: 'text' },
            { id: 'DEFENDANT_NAME', label: 'Defendant Name', placeholder: 'Name of person being sued', type: 'text' },
            { id: 'DEFENDANT_ADDRESS', label: 'Defendant Address', type: 'text' },
            { id: 'SUIT_AMOUNT', label: 'Recovery Amount', type: 'money' },
            { id: 'CAUSE_OF_ACTION_DATE', label: 'Date of Cause of Action', type: 'date' },
            { id: 'TRANSACTION_DETAILS', label: 'Details of Transaction', type: 'textarea' }
        ],
        content: `IN THE COURT OF {{COURT_NAME}}

Suit No. _______ / 2024

{{PLAINTIFF_NAME}} s/o {{PLAINTIFF_FATHER}},
R/o {{PLAINTIFF_ADDRESS}}
... Plaintiff

VERSUS

{{DEFENDANT_NAME}},
R/o {{DEFENDANT_ADDRESS}}
... Defendant

SUIT FOR RECOVERY OF RS. {{SUIT_AMOUNT}}/-

Respectfully Sheweth:

1. That the Plaintiff is a law-abiding citizen of Pakistan and resides at the address given above.

2. That the Defendant entered into a transaction with the Plaintiff regarding {{TRANSACTION_DETAILS}}.

3. That the Defendant has failed to pay the outstanding amount of Rs. {{SUIT_AMOUNT}} despite repeated requests and demands.

4. That the cause of action arose on {{CAUSE_OF_ACTION_DATE}} when the Defendant refused to pay the said amount, and it still continues.

5. That the parties reside within the jurisdiction of this Honourable Court, hence this Honourable Court has the jurisdiction to adjudicate upon this matter.

6. That the appropriate court fee has been affixed.

PRAYER:

It is therefore most respectfully prayed that a decree for recovery of Rs. {{SUIT_AMOUNT}} may kindly be passed in favour of the Plaintiff and against the Defendant, along with costs of the suit.

Any other relief which this Honourable Court deems fit may also be granted.

Plaintiff
Through Counsel`
    },
    '2': {
        id: '2',
        title: 'Divorce Petition',
        category: 'Family',
        description: 'Family court petition for dissolution of marriage (Khula).',
        fields: [
            { id: 'COURT_NAME', label: 'Family Court Name', type: 'text' },
            { id: 'PLAINTIFF_NAME', label: 'Petitioner (Wife)', type: 'text' },
            { id: 'DEFENDANT_NAME', label: 'Respondent (Husband)', type: 'text' },
            { id: 'MARRIAGE_DATE', label: 'Date of Marriage', type: 'date' },
            { id: 'DOWER_AMOUNT', label: 'Dower Amount (Haq Mehr)', type: 'money' },
            { id: 'REASON_FOR_DISSOLUTION', label: 'Reason for Dissolution', type: 'textarea' }
        ],
        content: `IN THE FAMILY COURT OF {{COURT_NAME}}

{{PLAINTIFF_NAME}}
... Petitioner

VERSUS

{{DEFENDANT_NAME}}
... Respondent

SUIT FOR DISSOLUTION OF MARRIAGE ON THE BASIS OF KHULA

Respectfully Sheweth:

1. That the Petitioner was married to the Respondent on {{MARRIAGE_DATE}} in accordance with Muslim Rites and Shariah.

2. That the dower amount was fixed at Rs. {{DOWER_AMOUNT}}.

3. That due to {{REASON_FOR_DISSOLUTION}}, it has become impossible for the parties to live together within the limits ordained by Almighty Allah.

PRAYER:

It is respectfully prayed that a decree for dissolution of marriage on the basis of Khula may kindly be passed in favour of the Petitioner.

Petitioner`
    }
};
