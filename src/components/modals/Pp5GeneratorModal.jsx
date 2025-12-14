// src/components/modals/Pp5GeneratorModal.jsx
// Updated to use the new Pp5TemplateManager with Excel template support

import React from 'react';
import PropTypes from 'prop-types';
import Pp5TemplateManager from './Pp5TemplateManager';

/**
 * Pp5GeneratorModal - Wrapper that opens Pp5TemplateManager
 * This maintains backward compatibility with existing modal system
 */
const Pp5GeneratorModal = ({ subjects, onClose }) => {
    return (
        <Pp5TemplateManager
            subjects={subjects}
            onClose={onClose}
        />
    );
};

Pp5GeneratorModal.propTypes = {
    subjects: PropTypes.array,
    onClose: PropTypes.func.isRequired,
};

export default Pp5GeneratorModal;