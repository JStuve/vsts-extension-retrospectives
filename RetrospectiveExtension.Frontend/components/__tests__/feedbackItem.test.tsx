import React from 'react';
import moment from 'moment';
import { shallow } from 'enzyme';
import FeedbackItem, { FeedbackItemHelper, IFeedbackItemProps } from '../feedbackItem';
import FeedbackColumn, { EmptyFeedbackId } from '../feedbackColumn';
import EditableDocumentCardTitle from '../editableDocumentCardTitle';
import Dialog from 'office-ui-fabric-react/lib/Dialog';
import { DefaultButton } from 'office-ui-fabric-react';
import ActionItemDisplay from '../actionItemDisplay';
import {
  testColumnProps,
  testColumnItem,
  testColumnTwoTitle,
  testUpvotes,
  testFeedbackItem,
  testColumns,
  testBoardId,
  testColumnUuidOne,
  testGroupColumnProps,
  testGroupFeedbackItemOne,
  testGroupColumnItemOne,
  testGroupColumnsObj,
  testGroupColumnUuidTwo
} from '../__mocks__/mocked_components/mockedFeedbackColumn';
import { IColumn } from '../feedbackBoard';
import { IFeedbackItemDocument } from '../../interfaces/feedback';

// Base render constants, these may change if the FeedbackItem component is changed.
const childDialogCount = 5;
const voteButtonCount = 2;

describe('Feedback Item', () => {
  test('Render a Feedback Item with no child Feedback Items.', () => {
    const testProps = FeedbackColumn.createFeedbackItemProps(
      testColumnProps, testColumnItem, true);

    const wrapper = shallow(<FeedbackItem {...testProps} />);
    const component = wrapper.children().dive();

    // Expect all child Dialogs to be hidden.
    const childDialogs = component.find(Dialog);
    expect(childDialogs).toHaveLength(childDialogCount);
    expect(childDialogs.findWhere((child) =>
      child.prop("hidden") === true)).toHaveLength(childDialogCount);

    /* Expect Default buttons for actions for each child dialog.
       Expect the Move Feedback Button to only exist for the second column. */
    const defaultButtons = component.findWhere((child) => child.type() === DefaultButton);
    expect(defaultButtons).toHaveLength(childDialogCount);
    expect(defaultButtons.findWhere((child) =>
      child.prop("className") === "move-feedback-item-column-button").
      html()).toContain(testColumnTwoTitle);

    // Expect the vote count to be propagated in multiple areas of the rendered component.
    const voteButtons = component.findWhere((child) =>
      child.prop("className") === "feedback-action-button feedback-add-vote");
    expect(voteButtons).toHaveLength(voteButtonCount);
    voteButtons.forEach((voteNode) => {
      expect(voteNode.html()).toContain(`Current vote count is ${testUpvotes}`);
    });
    expect(component.findWhere((child) =>
      child.prop("title") === "Vote").
      findWhere((nestedChild) =>
        nestedChild.prop("className") === "feedback-upvote-count").text()).
      toEqual(` ${testUpvotes}`);

    // Expect basic values of the Feedback Item to be propagated in multiple areas of the rendered component.
    expect(component.findWhere((child) =>
      child.prop("className") === "anonymous-created-date").text()).
      toEqual(moment(testFeedbackItem.createdDate).format('MMMM D, YYYY [at] h:mm A'));

    expect(component.findWhere((child) =>
      child.prop("className") === "card-id").text()).
      toEqual(`#${testColumns[testColumnUuidOne].columnItems.findIndex(
        (columnItem: { feedbackItem: { id: string; }; }) =>
          columnItem.feedbackItem.id === testFeedbackItem.id) + 1}`);

    expect(component.findWhere((child) =>
      child.type() === EditableDocumentCardTitle).prop("title")).
      toEqual(testFeedbackItem.title);

    const actionItemDisplay = component.findWhere((child) =>
      child.type() === ActionItemDisplay);
    expect(actionItemDisplay.prop("feedbackItemId")).toEqual(testFeedbackItem.id);
    expect(actionItemDisplay.prop("feedbackItemTitle")).toEqual(testFeedbackItem.title);
    expect(actionItemDisplay.prop("boardId")).toEqual(testBoardId);
    expect(actionItemDisplay.prop("boardTitle")).toEqual(testColumnProps.boardTitle);

    // Same formatting function
    const timerMinutes = Math.floor(testFeedbackItem.timerSecs / 60);
    const timerSeconds = testFeedbackItem.timerSecs % 60;
    const showLeadingZeroInSeconds = timerSeconds < 10;
    const formatTimer = showLeadingZeroInSeconds ? (timerMinutes + ':0' + timerSeconds) : (timerMinutes + ':' + timerSeconds);

    expect(component.findWhere((child) =>
      child.prop("title") === "Timer").html()).toContain(`${formatTimer} elapsed`);
  });

  describe('Group feedback items', () => {
    const testProps: IFeedbackItemProps = FeedbackColumn.createFeedbackItemProps(testGroupColumnProps, testGroupColumnItemOne, true);

    beforeEach(() => {
      testProps.isGroupedCarouselItem = true;
      testProps.isFocusModalHidden = false;
      testProps.groupedItemProps = {
        groupedCount: 1,
        isGroupExpanded: true,
        isMainItem: true,
        parentItemId: null,
        setIsGroupBeingDragged: () => false,
        toggleGroupExpand: () => null
      }
    });

    it('should show the related feedback header', () => {
      const wrapper = shallow(<FeedbackItem {...testProps} />);
      const component = wrapper.children().dive();

      component.findWhere(c => c.prop('className') === 'feedback-expand-group-focus').simulate('click', { stopPropagation() {} });

      const feedbackHeader = component.findWhere(c => c.prop('className') === 'related-feedback-header');
      expect(feedbackHeader).toHaveLength(1);
    })

    it('should show the related feedback item title', () => {
      const wrapper = shallow(<FeedbackItem {...testProps} />);
      const component = wrapper.children().dive();

      component.findWhere(c => c.prop('className') === 'feedback-expand-group-focus').simulate('click', { stopPropagation() {} });

      const feedbackTitle = component.findWhere(c => c.prop('className') === 'related-feedback-title').first();
      expect(feedbackTitle.text()).toEqual(testGroupFeedbackItemOne.title);
    })

    it('should show the original column information', () => {
      const wrapper = shallow(<FeedbackItem {...testProps} />);
      const component = wrapper.children().dive();

      component.findWhere(c => c.prop('className') === 'feedback-expand-group-focus').simulate('click', { stopPropagation() {} });

      const originalColumn = component.findWhere(c => c.prop('className') === 'original-column-info').first();
      expect(originalColumn.text()).toEqual(`Original Column: ${testGroupColumnsObj[testGroupColumnUuidTwo].columnProperties.title}`);
    })
  });

  describe('FeedbackItemHelper.getNextDisplayId', () => {

    test('should return 1 when there are not items', () => {
      const columns: { [id: string]: IColumn} = {
        '123': {
          columnProperties: null,
          columnItems: []
        }
      }

      const nextNumber: number = FeedbackItemHelper.getNextDisplayId(columns);
      expect(nextNumber).toEqual(1);
    })

    test('should return indexed next number', () => {
      const columns: { [id: string]: IColumn} = {
        '1': {
          columnProperties: null,
          columnItems: [
            {
              feedbackItem: {
                ...mockFeedbackItem()
              },
              actionItems: []
            }
          ]
        },
        '2': {
          columnProperties: null,
          columnItems: [
            {
              feedbackItem: {
                ...mockFeedbackItem()
              },
              actionItems: []
            }
          ]
        }
      }

      const nextNumber: number = FeedbackItemHelper.getNextDisplayId(columns);
      expect(nextNumber).toEqual(3);
    })

    test('should return displayId next number', () => {
      const columns: { [id: string]: IColumn} = {
        '1': {
          columnProperties: null,
          columnItems: [
            {
              feedbackItem: {
                ...mockFeedbackItem(),
                displayId: 1
              },
              actionItems: []
            }
          ]
        },
        '2': {
          columnProperties: null,
          columnItems: [
            {
              feedbackItem: {
                ...mockFeedbackItem(),
                displayId: 3
              },
              actionItems: []
            }
          ]
        }
      }

      const nextNumber: number = FeedbackItemHelper.getNextDisplayId(columns);
      expect(nextNumber).toEqual(4);
    })

    test('should return displayId next number with missing displayId', () => {
      const columns: { [id: string]: IColumn} = {
        '1': {
          columnProperties: null,
          columnItems: [
            {
              feedbackItem: {
                ...mockFeedbackItem()
              },
              actionItems: []
            }
          ]
        },
        '2': {
          columnProperties: null,
          columnItems: [
            {
              feedbackItem: {
                ...mockFeedbackItem(),
                displayId: 1
              },
              actionItems: []
            }
          ]
        }
      }

      const nextNumber: number = FeedbackItemHelper.getNextDisplayId(columns);
      expect(nextNumber).toEqual(2);
    })

    test('should return displayId next number ignoring emptyFeedbackItem items', () => {
      const columns: { [id: string]: IColumn} = {
        '1': {
          columnProperties: null,
          columnItems: [
            {
              feedbackItem: {
                ...mockFeedbackItem(),
                id: EmptyFeedbackId,
                displayId: 2,
              },
              actionItems: []
            }
          ]
        },
        '2': {
          columnProperties: null,
          columnItems: [
            {
              feedbackItem: {
                ...mockFeedbackItem(),
                displayId: 1
              },
              actionItems: []
            }
          ]
        }
      }

      const nextNumber: number = FeedbackItemHelper.getNextDisplayId(columns);
      expect(nextNumber).toEqual(2);
    })
  })
});

function mockFeedbackItem(): IFeedbackItemDocument {
  return {
    id: "",
    boardId: '',
    title: '',
    columnId: '',
    originalColumnId: '',
    upvotes: 0,
    voteCollection: {},
    createdDate: null,
    userIdRef: '',
    timerSecs: 0,
    timerstate: false,
    timerId: null,
    groupIds: [],
    isGroupedCarouselItem: false,
    displayId: 0
  }
}
