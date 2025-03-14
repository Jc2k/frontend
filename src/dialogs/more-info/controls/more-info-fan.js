import "@material/mwc-list/mwc-list-item";
import "@polymer/iron-flex-layout/iron-flex-layout-classes";
import { html } from "@polymer/polymer/lib/utils/html-tag";
/* eslint-plugin-disable lit */
import { PolymerElement } from "@polymer/polymer/polymer-element";
import { attributeClassNames } from "../../../common/entity/attribute_class_names";
import { supportsFeature } from "../../../common/entity/supports-feature";
import "../../../components/ha-attributes";
import "../../../components/ha-icon";
import "../../../components/ha-icon-button";
import "../../../components/ha-labeled-slider";
import "../../../components/ha-select";
import "../../../components/ha-switch";
import { FanEntityFeature } from "../../../data/fan";
import { EventsMixin } from "../../../mixins/events-mixin";
import LocalizeMixin from "../../../mixins/localize-mixin";

/*
 * @appliesMixin EventsMixin
 */
class MoreInfoFan extends LocalizeMixin(EventsMixin(PolymerElement)) {
  static get template() {
    return html`
      <style include="iron-flex"></style>
      <style>
        .container-preset_modes,
        .container-direction,
        .container-percentage,
        .container-oscillating {
          display: none;
        }

        .has-percentage .container-percentage,
        .has-preset_modes .container-preset_modes,
        .has-direction .container-direction,
        .has-oscillating .container-oscillating {
          display: block;
          margin-top: 8px;
        }

        ha-select {
          width: 100%;
        }
      </style>

      <div class$="[[computeClassNames(stateObj)]]">
        <div class="container-percentage">
          <ha-labeled-slider
            caption="[[localize('ui.card.fan.speed')]]"
            min="0"
            max="100"
            step="[[computePercentageStepSize(stateObj)]]"
            value="{{percentageSliderValue}}"
            on-change="percentageChanged"
            pin=""
            extra=""
          ></ha-labeled-slider>
        </div>

        <div class="container-preset_modes">
          <ha-select
            label="[[localize('ui.card.fan.preset_mode')]]"
            value="[[stateObj.attributes.preset_mode]]"
            on-selected="presetModeChanged"
            fixedMenuPosition
            naturalMenuWidth
            on-closed="stopPropagation"
          >
            <template
              is="dom-repeat"
              items="[[stateObj.attributes.preset_modes]]"
            >
              <mwc-list-item value="[[item]]">[[item]]</mwc-list-item>
            </template>
          </ha-select>
        </div>

        <div class="container-oscillating">
          <div class="center horizontal layout single-row">
            <div class="flex">[[localize('ui.card.fan.oscillate')]]</div>
            <ha-switch
              checked="[[oscillationToggleChecked]]"
              on-change="oscillationToggleChanged"
            >
            </ha-switch>
          </div>
        </div>

        <div class="container-direction">
          <div class="direction">
            <div>[[localize('ui.card.fan.direction')]]</div>
            <ha-icon-button
              on-click="onDirectionReverse"
              title="[[localize('ui.card.fan.reverse')]]"
              disabled="[[computeIsRotatingReverse(stateObj)]]"
            >
              <ha-icon icon="hass:rotate-left"></ha-icon>
            </ha-icon-button>
            <ha-icon-button
              on-click="onDirectionForward"
              title="[[localize('ui.card.fan.forward')]]"
              disabled="[[computeIsRotatingForward(stateObj)]]"
            >
              <ha-icon icon="hass:rotate-right"></ha-icon>
            </ha-icon-button>
          </div>
        </div>
      </div>

      <ha-attributes
        hass="[[hass]]"
        state-obj="[[stateObj]]"
        extra-filters="percentage_step,speed,preset_mode,preset_modes,speed_list,percentage,oscillating,direction"
      ></ha-attributes>
    `;
  }

  static get properties() {
    return {
      hass: {
        type: Object,
      },

      stateObj: {
        type: Object,
        observer: "stateObjChanged",
      },

      oscillationToggleChecked: {
        type: Boolean,
      },

      percentageSliderValue: {
        type: Number,
      },
    };
  }

  stateObjChanged(newVal, oldVal) {
    if (newVal) {
      this.setProperties({
        oscillationToggleChecked: newVal.attributes.oscillating,
        percentageSliderValue: newVal.attributes.percentage,
      });
    }

    if (oldVal) {
      setTimeout(() => {
        this.fire("iron-resize");
      }, 500);
    }
  }

  computePercentageStepSize(stateObj) {
    if (stateObj.attributes.percentage_step) {
      return stateObj.attributes.percentage_step;
    }
    return 1;
  }

  computeClassNames(stateObj) {
    return (
      "more-info-fan " +
      (supportsFeature(stateObj, FanEntityFeature.SET_SPEED)
        ? "has-percentage "
        : "") +
      (stateObj.attributes.preset_modes &&
      stateObj.attributes.preset_modes.length
        ? "has-preset_modes "
        : "") +
      attributeClassNames(stateObj, ["oscillating", "direction"])
    );
  }

  presetModeChanged(ev) {
    const oldVal = this.stateObj.attributes.preset_mode;
    const newVal = ev.target.value;

    if (!newVal || oldVal === newVal) return;

    this.hass.callService("fan", "set_preset_mode", {
      entity_id: this.stateObj.entity_id,
      preset_mode: newVal,
    });
  }

  stopPropagation(ev) {
    ev.stopPropagation();
  }

  percentageChanged(ev) {
    const oldVal = parseInt(this.stateObj.attributes.percentage, 10);
    const newVal = ev.target.value;

    if (isNaN(newVal) || oldVal === newVal) return;

    this.hass.callService("fan", "set_percentage", {
      entity_id: this.stateObj.entity_id,
      percentage: newVal,
    });
  }

  oscillationToggleChanged(ev) {
    const oldVal = this.stateObj.attributes.oscillating;
    const newVal = ev.target.checked;

    if (oldVal === newVal) return;

    this.hass.callService("fan", "oscillate", {
      entity_id: this.stateObj.entity_id,
      oscillating: newVal,
    });
  }

  onDirectionReverse() {
    this.hass.callService("fan", "set_direction", {
      entity_id: this.stateObj.entity_id,
      direction: "reverse",
    });
  }

  onDirectionForward() {
    this.hass.callService("fan", "set_direction", {
      entity_id: this.stateObj.entity_id,
      direction: "forward",
    });
  }

  computeIsRotatingReverse(stateObj) {
    return stateObj.attributes.direction === "reverse";
  }

  computeIsRotatingForward(stateObj) {
    return stateObj.attributes.direction === "forward";
  }
}

customElements.define("more-info-fan", MoreInfoFan);
