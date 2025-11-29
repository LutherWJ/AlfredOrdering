<script setup lang="ts">
import { ref, computed } from 'vue';
import type { MenuExtra, SelectedExtra } from '../../shared/types';

interface Props {
  extra: MenuExtra;
  modelValue: SelectedExtra[];  // All selected extras at this level
  depth?: number;
  parentMaxSelectable?: number;  // Tells us if this should be a radio button
  parentExtraId?: string;  // Parent's extra_id for radio group naming
}

const props = withDefaults(defineProps<Props>(), {
  depth: 0,
  parentMaxSelectable: undefined,
  parentExtraId: undefined
});

const emit = defineEmits<{
  'update:modelValue': [value: SelectedExtra[]]
}>();

// Local state for nested selections
const nestedSelections = ref<Record<string, SelectedExtra[]>>({});

// Check if this extra is currently selected
const isSelected = computed(() => {
  return props.modelValue.some(se => se.extra_id === props.extra.extra_id);
});

// Get the selected extra object if it exists
const selectedExtra = computed(() => {
  return props.modelValue.find(se => se.extra_id === props.extra.extra_id);
});

// Check if this extra has nested extras
const hasNested = computed(() => {
  return props.extra.extras && props.extra.extras.length > 0;
});

// Determine input type based on parent's max_selectable
const inputType = computed(() => {
  // Depth 0 (categories) don't get inputs - they're just labels
  if (props.depth === 0) return 'none';

  // If parent allows only 1 selection, use radio buttons
  if (props.parentMaxSelectable === 1) return 'radio';

  // Otherwise use checkboxes
  return 'checkbox';
});

// Generate stable name for radio groups based on parent extra ID
const radioGroupName = computed(() => {
  return props.parentExtraId ? `radio-group-${props.parentExtraId}` : `radio-group-${props.depth}`;
});

// Toggle selection of this extra
function toggleSelection() {
  if (!props.extra.is_available) return;

  let newValue = [...props.modelValue];

  if (isSelected.value) {
    // Deselect - remove this extra
    newValue = newValue.filter(se => se.extra_id !== props.extra.extra_id);
  } else {
    // If this is a radio button (parent allows only 1), clear all siblings first
    if (props.parentMaxSelectable === 1) {
      newValue = [];
    }

    // Add this extra to selection
    newValue.push({
      extra_id: props.extra.extra_id,
      extras: []
    });
  }

  emit('update:modelValue', newValue);
}

// Update nested selections for a child extra
function updateNested(selectedExtras: SelectedExtra[]) {
  // Store the nested selections locally
  const allNestedExtras = selectedExtras;

  let newValue = [...props.modelValue];
  let currentExtra = newValue.find(se => se.extra_id === props.extra.extra_id);

  // If this extra isn't selected yet, add it (for depth 0 categories)
  if (!currentExtra && props.depth === 0) {
    currentExtra = {
      extra_id: props.extra.extra_id,
      extras: []
    };
    newValue.push(currentExtra);
  }

  if (currentExtra) {
    // Update the nested extras
    currentExtra.extras = allNestedExtras;

    // If no nested selections remain and this is not required, remove it
    if (currentExtra.extras.length === 0 && !props.extra.is_required) {
      newValue = newValue.filter(se => se.extra_id !== props.extra.extra_id);
    }

    emit('update:modelValue', newValue);
  }
}

// Check if we should show nested extras
const showNested = computed(() => {
  // Always show nested for depth 0 (categories like "Entree", "Side")
  if (props.depth === 0 && hasNested.value) return true;

  // For depth > 0, show nested only if this item is selected
  return hasNested.value && isSelected.value;
});
</script>

<template>
  <div class="mb-3">
    <!-- Selection control -->
    <label
      class="flex items-center gap-2 mb-2"
      :class="{ 'cursor-pointer': inputType !== 'none' }"
    >
      <!-- Radio button for single-select groups -->
      <input
        v-if="inputType === 'radio'"
        type="radio"
        :name="radioGroupName"
        :checked="isSelected"
        @change="toggleSelection"
        :disabled="!extra.is_available"
        class="w-4 h-4 text-blue-600 focus:ring-blue-500"
      />

      <!-- Checkbox for multi-select -->
      <input
        v-else-if="inputType === 'checkbox'"
        type="checkbox"
        :checked="isSelected"
        @change="toggleSelection"
        :disabled="!extra.is_available"
        class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
      />

      <!-- Label text -->
      <span
        :class="{
          'font-semibold text-gray-900': depth === 0,
          'font-medium text-gray-800': depth === 1,
          'text-gray-700': depth > 1,
          'text-gray-400': !extra.is_available
        }"
      >
        {{ extra.extra_name }}
      </span>

      <!-- Price delta -->
      <span v-if="extra.price_delta > 0" class="text-sm text-gray-600">
        +${{ extra.price_delta.toFixed(2) }}
      </span>

      <!-- Required indicator -->
      <span v-if="extra.is_required && depth === 0" class="text-sm text-red-600 font-medium">
        *
      </span>

      <!-- Unavailable indicator -->
      <span v-if="!extra.is_available" class="text-sm text-gray-400 italic">
        (Unavailable)
      </span>
    </label>

    <!-- Description -->
    <p v-if="extra.extra_description && depth === 0" class="text-sm text-gray-600 mb-2 ml-6">
      {{ extra.extra_description }}
    </p>

    <!-- Nested extras (recursive) -->
    <div v-if="showNested" :class="depth === 0 ? 'ml-6 mt-2 space-y-2' : 'ml-6 mt-2 space-y-1'">
      <ExtraSelector
        v-for="nestedExtra in extra.extras"
        :key="nestedExtra.extra_id"
        :extra="nestedExtra"
        :modelValue="selectedExtra?.extras || []"
        @update:modelValue="updateNested"
        :depth="depth + 1"
        :parentMaxSelectable="extra.max_selectable"
        :parentExtraId="extra.extra_id"
      />
    </div>
  </div>
</template>

<style scoped>
/* Add any specific styling here if needed */
</style>