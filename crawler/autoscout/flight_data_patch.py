from types import SimpleNamespace

from njsparser.parser import flight_data, types


def tolerate_empty_flight_data_rows() -> None:
    original = flight_data.orjson
    if getattr(original, 'tolerates_empty_rows', False):
        return

    flight_data.orjson = SimpleNamespace(
        loads=lambda raw_value: original.loads(raw_value) if raw_value else None,
        JSONDecodeError=original.JSONDecodeError,
        tolerates_empty_rows=True)


def tolerate_referenced_module_chunks() -> None:
    original = types.Module.__post_init__
    if getattr(original, 'tolerates_referenced_chunks', False):
        return

    def verify_without_chunk_pairs(module: types.Module) -> None:
        if not _chunks_are_references(module.value):
            original(module)
        elif types.ENABLE_TYPE_VERIF:
            assert 3 <= len(module.value) <= 4
            assert isinstance(module.module_id, int)
            assert isinstance(module.module_name, str)

    verify_without_chunk_pairs.tolerates_referenced_chunks = True
    types.Module.__post_init__ = verify_without_chunk_pairs


def _chunks_are_references(value: list | dict) -> bool:
    return (isinstance(value, list)
            and len(value) >= 2
            and isinstance(value[1], list)
            and all(isinstance(chunk, str) and chunk.startswith('$') for chunk in value[1]))
