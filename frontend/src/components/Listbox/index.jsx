import React, {
  useMemo,
  useContext,
  forwardRef,
  useRef,
  useEffect,
} from "react";
import PropTypes from "prop-types";
import { FixedSizeList } from "react-window";
import { styled, autocompleteClasses, Popper } from "@mui/material";

// Constants for react-window listbox
const LISTBOX_PADDING = 8;
const MAX_VISIBLE = 8;
const ITEM_SIZE = 36;

function renderRow({ data, index, style }) {
  const item = data[index];
  const inlineStyle = {
    ...style,
    top: style.top + LISTBOX_PADDING,
  };

  return React.cloneElement(item, {
    style: inlineStyle,
  });
}

const OuterElementContext = React.createContext({});

const OuterElementType = forwardRef(function OuterElementType(props, ref) {
  const outerProps = useContext(OuterElementContext);
  return <div ref={ref} {...props} {...outerProps} />;
});

// Reset the cache of the list when the data changes (unused)
function useResetCache(data) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current != null) {
      ref.current.resetAfterIndex(0, true);
    }
  }, [data]);
  return ref;
}

export const StyledPopper = styled(Popper)({
  [`& .${autocompleteClasses.listbox}`]: {
    boxSizing: "border-box",
    "& ul": {
      padding: 0,
      margin: 0,
    },
  },
});

export const ListboxComponent = forwardRef(
  function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const itemData = useMemo(
      () => React.Children.toArray(children),
      [children],
    );
    // These also work, but may be worse
    // const itemData = React.Children.toArray(children);
    // const itemData = React.useMemo(() => {
    //   return Array.isArray(children) ? children : [children];
    // }, [children]);

    const itemCount = itemData.length;
    const height =
      Math.min(itemCount, MAX_VISIBLE) * ITEM_SIZE + 2 * LISTBOX_PADDING;

    return (
      <div ref={ref}>
        <OuterElementContext.Provider value={other}>
          <FixedSizeList
            itemData={itemData}
            height={height}
            width="100%"
            outerElementType={OuterElementType}
            innerElementType="ul"
            itemSize={ITEM_SIZE}
            overscanCount={5}
            itemCount={itemCount}
          >
            {renderRow}
          </FixedSizeList>
        </OuterElementContext.Provider>
      </div>
    );
  },
);

ListboxComponent.propTypes = {
  children: PropTypes.node,
};

export default ListboxComponent;
