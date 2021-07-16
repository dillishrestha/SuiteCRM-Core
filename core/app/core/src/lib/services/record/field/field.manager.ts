/**
 * SuiteCRM is a customer relationship management program developed by SalesAgility Ltd.
 * Copyright (C) 2021 SalesAgility Ltd.
 *
 * This program is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License version 3 as published by the
 * Free Software Foundation with the addition of the following permission added
 * to Section 15 as permitted in Section 7(a): FOR ANY PART OF THE COVERED WORK
 * IN WHICH THE COPYRIGHT IS OWNED BY SALESAGILITY, SALESAGILITY DISCLAIMS THE
 * WARRANTY OF NON INFRINGEMENT OF THIRD PARTY RIGHTS.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
 * FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * In accordance with Section 7(b) of the GNU Affero General Public License
 * version 3, these Appropriate Legal Notices must retain the display of the
 * "Supercharged by SuiteCRM" logo. If the display of the logos is not reasonably
 * feasible for technical reasons, the Appropriate Legal Notices must display
 * the words "Supercharged by SuiteCRM".
 */

import {Field, Record, ViewFieldDefinition} from 'common';
import {LanguageStore} from '../../../store/language/language.store';
import {Injectable} from '@angular/core';
import {SavedFilter} from '../../../store/saved-filters/saved-filter.model';
import {FieldBuilder} from './field.builder';
import {GroupFieldBuilder} from './group-field.builder';
import {AttributeBuilder} from './attribute.builder';
import {FilterFieldBuilder} from './filter-field.builder';
import {FilterAttributeBuilder} from './filter-attribute.builder';

@Injectable({
    providedIn: 'root'
})
export class FieldManager {

    constructor(
        protected fieldBuilder: FieldBuilder,
        protected groupFieldBuilder: GroupFieldBuilder,
        protected attributeBuilder: AttributeBuilder,
        protected filterFieldBuilder: FilterFieldBuilder,
        protected filterAttributeBuilder: FilterAttributeBuilder
    ) {
    }

    /**
     * Build minimally initialised field object
     *
     * @param {string} type field type
     * @param {string} value field value
     * @returns {object} Field
     */
    public buildShallowField(type: string, value: string): Field {
        return {
            type,
            value,
            definition: {
                type
            }
        } as Field;
    }

    /**
     * Build and add field to record
     *
     * @param {object} record Record
     * @param {object} viewField ViewFieldDefinition
     * @param {object} language LanguageStore
     * @returns {object}Field
     */
    public addField(record: Record, viewField: ViewFieldDefinition, language: LanguageStore = null): Field {

        const field = this.fieldBuilder.buildField(record, viewField, language);

        this.addToRecord(record, viewField.name, field);
        this.groupFieldBuilder.addGroupFields(
            record,
            viewField,
            language,
            this.isFieldInitialized.bind(this),
            this.fieldBuilder.buildField.bind(this.fieldBuilder),
            this.addToRecord.bind(this)
        );

        this.attributeBuilder.addAttributes(
            record,
            record.fields,
            viewField,
            language,
            this.attributeBuilder.buildAttribute.bind(this.attributeBuilder),
            this.attributeBuilder.addAttributeToRecord.bind(this.attributeBuilder)
        );

        return field;
    }


    /**
     * Build and add filter field to record
     *
     * @param {object} record Record
     * @param {object} viewField ViewFieldDefinition
     * @param {object} language LanguageStore
     * @returns {object}Field
     */
    public addFilterField(record: SavedFilter, viewField: ViewFieldDefinition, language: LanguageStore = null): Field {

        const field = this.filterFieldBuilder.buildFilterField(record, viewField, language);

        this.filterFieldBuilder.addToSavedFilter(record, viewField.name, field);
        this.groupFieldBuilder.addGroupFields(
            record,
            viewField,
            language,
            this.filterFieldBuilder.isCriteriaFieldInitialized.bind(this.filterFieldBuilder),
            this.filterFieldBuilder.buildFilterField.bind(this.filterFieldBuilder),
            this.filterFieldBuilder.addToSavedFilter.bind(this.filterFieldBuilder)
        );

        field.criteria = this.filterFieldBuilder.initFieldFilter(record.criteria, viewField, field);

        this.attributeBuilder.addAttributes(
            record,
            record.criteriaFields,
            viewField,
            language,
            this.filterAttributeBuilder.buildFilterAttribute.bind(this.filterAttributeBuilder),
            this.filterAttributeBuilder.addAttributeToSavedFilter.bind(this.filterAttributeBuilder)
        );

        return field;
    }


    /**
     * Add field to record
     *
     * @param {object} record Record
     * @param {string} name string
     * @param {object} field Field
     */
    public addToRecord(record: Record, name: string, field: Field): void {

        if (!record || !name || !field) {
            return;
        }

        if (!record.fields) {
            record.fields = {};
        }

        record.fields[name] = field;

        if (record.formGroup && field.formControl) {
            record.formGroup.addControl(name, field.formControl);
        }
    }


    /**
     * Is field initialized in record
     *
     * @param {object} record Record
     * @param {string} fieldName field
     * @returns {boolean} isInitialized
     */
    protected isFieldInitialized(record: Record, fieldName: string): boolean {
        return !!record.fields[fieldName];
    }

}
