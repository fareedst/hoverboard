/**
 * Tag Renderer Module
 * Handles visual representation and interaction for different types of tags
 */

class TagRenderer {
  constructor(config) {
    this.config = config;
  }

  /**
   * Create a current tag element (existing tag on the pin)
   */
  createCurrentTag(tag, pin, onDelete) {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag current-tag';
    tagElement.textContent = tag;
    
    if (this.config.showTooltips) {
      tagElement.title = 'Double-click to delete tag';
    }

    // Add delete functionality on double-click
    tagElement.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (confirm(`Delete tag "${tag}"?`)) {
        onDelete(tag);
      }
    });

    // Add visual feedback
    tagElement.addEventListener('mouseenter', () => {
      tagElement.classList.add('hover');
    });

    tagElement.addEventListener('mouseleave', () => {
      tagElement.classList.remove('hover');
    });

    return tagElement;
  }

  /**
   * Create a recent tag element (clickable to add to pin)
   */
  createRecentTag(tag, pin, onAdd) {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag recent-tag clickable';
    tagElement.textContent = tag;
    
    if (this.config.showTooltips) {
      tagElement.title = 'Click to add tag to bookmark';
    }

    // Add click to add functionality
    tagElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onAdd(tag);
    });

    // Add visual feedback
    tagElement.addEventListener('mouseenter', () => {
      tagElement.classList.add('hover');
    });

    tagElement.addEventListener('mouseleave', () => {
      tagElement.classList.remove('hover');
    });

    return tagElement;
  }

  /**
   * Create a content tag element (suggested from page content)
   */
  createContentTag(tag, pin, onAdd) {
    const tagElement = document.createElement('span');
    tagElement.className = 'tag content-tag clickable suggested';
    tagElement.textContent = tag;
    
    if (this.config.showTooltips) {
      tagElement.title = 'Suggested tag - click to add';
    }

    // Add click to add functionality
    tagElement.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onAdd(tag);
    });

    // Add visual feedback
    tagElement.addEventListener('mouseenter', () => {
      tagElement.classList.add('hover');
    });

    tagElement.addEventListener('mouseleave', () => {
      tagElement.classList.remove('hover');
    });

    return tagElement;
  }

  /**
   * Create a tag with custom styling and behavior
   */
  createCustomTag(tag, options = {}) {
    const {
      className = 'tag',
      tooltip = '',
      onClick = null,
      onDoubleClick = null,
      removable = false
    } = options;

    const tagElement = document.createElement('span');
    tagElement.className = className;
    tagElement.textContent = tag;
    
    if (tooltip && this.config.showTooltips) {
      tagElement.title = tooltip;
    }

    // Add remove button if removable
    if (removable) {
      const removeBtn = document.createElement('span');
      removeBtn.className = 'tag-remove';
      removeBtn.textContent = '×';
      removeBtn.title = 'Remove tag';
      
      removeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDoubleClick) {
          onDoubleClick(tag);
        }
      });
      
      tagElement.appendChild(removeBtn);
    }

    // Add event listeners
    if (onClick) {
      tagElement.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick(tag);
      });
      tagElement.classList.add('clickable');
    }

    if (onDoubleClick && !removable) {
      tagElement.addEventListener('dblclick', (e) => {
        e.preventDefault();
        e.stopPropagation();
        onDoubleClick(tag);
      });
    }

    // Add visual feedback
    tagElement.addEventListener('mouseenter', () => {
      tagElement.classList.add('hover');
    });

    tagElement.addEventListener('mouseleave', () => {
      tagElement.classList.remove('hover');
    });

    return tagElement;
  }

  /**
   * Create a tag input element for inline editing
   */
  createTagInput(placeholder = 'Enter tag...', onSubmit, onCancel) {
    const container = document.createElement('span');
    container.className = 'tag-input-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tag-input';
    input.placeholder = placeholder;

    const submitBtn = document.createElement('button');
    submitBtn.className = 'tag-input-submit';
    submitBtn.textContent = '✓';
    submitBtn.title = 'Add tag';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'tag-input-cancel';
    cancelBtn.textContent = '×';
    cancelBtn.title = 'Cancel';

    const submit = () => {
      const value = input.value.trim();
      if (value) {
        onSubmit(value);
      }
    };

    const cancel = () => {
      if (onCancel) {
        onCancel();
      }
    };

    // Event listeners
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        submit();
      } else if (e.key === 'Escape') {
        cancel();
      }
    });

    submitBtn.addEventListener('click', submit);
    cancelBtn.addEventListener('click', cancel);

    // Auto-focus input
    setTimeout(() => input.focus(), 0);

    container.appendChild(input);
    container.appendChild(submitBtn);
    container.appendChild(cancelBtn);

    return container;
  }

  /**
   * Create a collapsible tag group
   */
  createTagGroup(title, tags, options = {}) {
    const {
      collapsible = true,
      collapsed = false,
      maxVisible = 10,
      onTagClick = null,
      onTagDoubleClick = null
    } = options;

    const container = document.createElement('div');
    container.className = 'tag-group';

    // Group header
    const header = document.createElement('div');
    header.className = 'tag-group-header';
    
    if (collapsible) {
      header.classList.add('collapsible');
      header.addEventListener('click', () => {
        container.classList.toggle('collapsed');
      });
    }

    const titleSpan = document.createElement('span');
    titleSpan.className = 'tag-group-title';
    titleSpan.textContent = title;

    const countSpan = document.createElement('span');
    countSpan.className = 'tag-group-count';
    countSpan.textContent = `(${tags.length})`;

    header.appendChild(titleSpan);
    header.appendChild(countSpan);

    // Tags container
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'tag-group-tags';

    // Add tags
    const visibleTags = tags.slice(0, maxVisible);
    const hiddenTags = tags.slice(maxVisible);

    visibleTags.forEach(tag => {
      const tagElement = this.createCustomTag(tag, {
        onClick: onTagClick,
        onDoubleClick: onTagDoubleClick
      });
      tagsContainer.appendChild(tagElement);
    });

    // Show more button if needed
    if (hiddenTags.length > 0) {
      const showMoreBtn = document.createElement('span');
      showMoreBtn.className = 'tag-show-more';
      showMoreBtn.textContent = `+${hiddenTags.length} more`;
      
      showMoreBtn.addEventListener('click', () => {
        hiddenTags.forEach(tag => {
          const tagElement = this.createCustomTag(tag, {
            onClick: onTagClick,
            onDoubleClick: onTagDoubleClick
          });
          tagsContainer.appendChild(tagElement);
        });
        showMoreBtn.remove();
      });
      
      tagsContainer.appendChild(showMoreBtn);
    }

    container.appendChild(header);
    container.appendChild(tagsContainer);

    // Apply initial collapsed state
    if (collapsed) {
      container.classList.add('collapsed');
    }

    return container;
  }

  /**
   * Create a tag filter/search input
   */
  createTagFilter(tags, onFilter) {
    const container = document.createElement('div');
    container.className = 'tag-filter-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'tag-filter-input';
    input.placeholder = 'Filter tags...';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'tag-filter-clear';
    clearBtn.textContent = '×';
    clearBtn.title = 'Clear filter';

    const filter = () => {
      const query = input.value.toLowerCase().trim();
      const filtered = query 
        ? tags.filter(tag => tag.toLowerCase().includes(query))
        : tags;
      
      onFilter(filtered, query);
    };

    const clear = () => {
      input.value = '';
      onFilter(tags, '');
    };

    input.addEventListener('input', filter);
    clearBtn.addEventListener('click', clear);

    container.appendChild(input);
    container.appendChild(clearBtn);

    return container;
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = newConfig;
  }

  /**
   * Get CSS styles for tags (to be injected into page)
   */
  getTagStyles() {
    return `
      .tag {
        display: inline-block;
        padding: 2px 8px;
        margin: 2px;
        background: #f0f0f0;
        border: 1px solid #ccc;
        border-radius: 12px;
        font-size: 12px;
        line-height: 1.4;
        cursor: default;
        user-select: none;
        transition: all 0.2s ease;
      }

      .tag.clickable {
        cursor: pointer;
      }

      .tag.clickable:hover,
      .tag.hover {
        background: #e0e0e0;
        border-color: #999;
        transform: translateY(-1px);
      }

      .tag.current-tag {
        background: #e3f2fd;
        border-color: #1976d2;
        color: #1976d2;
      }

      .tag.recent-tag {
        background: #f3e5f5;
        border-color: #7b1fa2;
        color: #7b1fa2;
      }

      .tag.content-tag {
        background: #e8f5e8;
        border-color: #388e3c;
        color: #388e3c;
      }

      .tag.suggested::before {
        content: "💡 ";
        font-size: 10px;
      }

      .tag-remove {
        margin-left: 4px;
        cursor: pointer;
        font-weight: bold;
        color: #999;
      }

      .tag-remove:hover {
        color: #f44336;
      }

      .tag-input-container {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin: 2px;
      }

      .tag-input {
        padding: 2px 6px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 12px;
        width: 100px;
      }

      .tag-input-submit,
      .tag-input-cancel {
        padding: 2px 6px;
        border: 1px solid #ccc;
        border-radius: 3px;
        background: white;
        cursor: pointer;
        font-size: 11px;
      }

      .tag-input-submit:hover {
        background: #4caf50;
        color: white;
      }

      .tag-input-cancel:hover {
        background: #f44336;
        color: white;
      }

      .tag-group {
        margin: 8px 0;
      }

      .tag-group-header {
        font-weight: bold;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .tag-group-header.collapsible {
        cursor: pointer;
      }

      .tag-group-header.collapsible::before {
        content: "▼";
        font-size: 10px;
        transition: transform 0.2s ease;
      }

      .tag-group.collapsed .tag-group-header::before {
        transform: rotate(-90deg);
      }

      .tag-group.collapsed .tag-group-tags {
        display: none;
      }

      .tag-group-count {
        font-size: 11px;
        color: #666;
        font-weight: normal;
      }

      .tag-show-more {
        display: inline-block;
        padding: 2px 8px;
        margin: 2px;
        background: #f9f9f9;
        border: 1px dashed #ccc;
        border-radius: 12px;
        font-size: 11px;
        cursor: pointer;
        color: #666;
      }

      .tag-show-more:hover {
        background: #f0f0f0;
        border-color: #999;
      }

      .tag-filter-container {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-bottom: 8px;
      }

      .tag-filter-input {
        flex: 1;
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 12px;
      }

      .tag-filter-clear {
        padding: 4px 8px;
        border: 1px solid #ccc;
        border-radius: 4px;
        background: white;
        cursor: pointer;
        font-size: 12px;
      }

      .tag-filter-clear:hover {
        background: #f0f0f0;
      }
    `;
  }
}

export { TagRenderer }; 