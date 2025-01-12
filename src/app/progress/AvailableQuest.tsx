import {
  DestinyActivityDefinition,
  DestinyDisplayPropertiesDefinition,
  DestinyMilestoneDefinition,
  DestinyMilestoneQuest,
  DestinyActivityModifierDefinition,
  DestinyClass
} from 'bungie-api-ts/destiny2';
import { t } from 'app/i18next-t';
import React from 'react';
import _ from 'lodash';
import { D2ManifestDefinitions } from '../destiny2/d2-definitions.service';
import BungieImage from '../dim-ui/BungieImage';
import MilestoneObjectiveStatus from './MilestoneObjectiveStatus';
import Objective from './Objective';
import { ActivityModifier } from './ActivityModifier';

/**
 * Most milestones are represented as a quest, with some objectives and a reward associated with them.
 */
export default function AvailableQuest({
  defs,
  milestoneDef,
  availableQuest,
  characterClass
}: {
  defs: D2ManifestDefinitions;
  milestoneDef: DestinyMilestoneDefinition;
  availableQuest: DestinyMilestoneQuest;
  characterClass: DestinyClass;
}) {
  const questDef = milestoneDef.quests[availableQuest.questItemHash];
  const displayProperties: DestinyDisplayPropertiesDefinition =
    questDef.displayProperties || milestoneDef.displayProperties;
  let activityDef: DestinyActivityDefinition | null = null;
  let modifiers: DestinyActivityModifierDefinition[] = [];
  if (availableQuest.activity) {
    activityDef = defs.Activity.get(availableQuest.activity.activityHash);
    if (availableQuest.activity.modifierHashes) {
      modifiers = availableQuest.activity.modifierHashes.map((h) => defs.ActivityModifier.get(h));
    }
  }
  const activityName = activityDef && activityDef.displayProperties.name;

  // Only look at the first reward, the rest are screwy (old engram versions, etc)
  const questRewards = questDef.questRewards
    ? _.take(
        questDef.questRewards.items
          .map((r) => defs.InventoryItem.get(r.itemHash))
          // Filter out rewards that are for other characters
          .filter(
            (i) =>
              i &&
              (i.classType === characterClass || i.classType === DestinyClass.Unknown) &&
              // And quest steps, they're not interesting
              !i.itemCategoryHashes.includes(16)
          ),
        1
      )
    : [];

  const objectives = availableQuest.status.stepObjectives;
  const objective = objectives.length ? objectives[0] : null;
  const objectiveDef = objective ? defs.Objective.get(objective.objectiveHash) : null;

  const tooltip = availableQuest.status.completed
    ? t('Progress.RewardEarned')
    : t('Progress.RewardNotEarned');
  const suppressObjectiveDescription = Boolean(
    objectiveDef && objectiveDef.progressDescription === displayProperties.description
  );
  const hideObjective =
    suppressObjectiveDescription && objective && objective.completionValue === 1;

  return (
    <div className="milestone-quest">
      <div className="milestone-icon" title={tooltip}>
        <BungieImage src={displayProperties.icon} />
        <MilestoneObjectiveStatus
          objective={objective}
          status={availableQuest.status}
          defs={defs}
        />
      </div>
      <div className="milestone-info">
        <span className="milestone-name">{displayProperties.name}</span>
        {activityName !== displayProperties.name && (
          <div className="milestone-location">{activityName}</div>
        )}
        <div className="milestone-description">{displayProperties.description}</div>
        <div className="quest-modifiers">
          {modifiers.map((modifier) => (
            <ActivityModifier key={modifier.hash} modifier={modifier} />
          ))}
        </div>
        {objective && !hideObjective && (
          <div className="quest-objectives">
            <Objective
              defs={defs}
              objective={objective}
              key={objective.objectiveHash}
              suppressObjectiveDescription={suppressObjectiveDescription}
            />
          </div>
        )}
        {questRewards.map((questReward) => (
          <div className="milestone-reward" key={questReward.hash}>
            <BungieImage src={questReward.displayProperties.icon} />
            <span>{questReward.displayProperties.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
