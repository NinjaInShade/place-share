import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useHttpClient } from "../../shared/hooks/http-hook";

import PlaceList from "../components/PlaceList";
import ErrorModal from "../../shared/components/UIElements/ErrorModal";
import LoadingSpinner from "../../shared/components/UIElements/LoadingSpinner";

const UserPlaces = () => {
  const userId = useParams().userId;
  const { isLoading, error, sendRequest, clearError } = useHttpClient();
  const [loadedPlaces, setLoadedPlaces] = useState();

  useEffect(() => {
    async function fetchPlaces() {
      try {
        const responseData = await sendRequest(`${process.env.REACT_APP_BACKEND_URL}/api/places/user/${userId}`);
        setLoadedPlaces(responseData.places);
      } catch (err) {}
    }
    fetchPlaces();
  }, [sendRequest, userId]);

  function placeDeletedHandler(deletedPlaceId) {
    setLoadedPlaces((prevPlaces) => prevPlaces.filter((p) => p.id !== deletedPlaceId));
  }

  return (
    <React.Fragment>
      <ErrorModal error={error} onClear={clearError} />
      {isLoading && (
        <div className="center">
          <LoadingSpinner />
        </div>
      )}
      {!isLoading && loadedPlaces && <PlaceList items={loadedPlaces} onDeletePlace={placeDeletedHandler} />}
    </React.Fragment>
  );
};

export default UserPlaces;
